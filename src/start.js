import { ReceiptBus } from './receipt-bus.js';
import { RecallSubscriber } from './subscribers/recall.js';
import { IntelligenceSubscriber } from './subscribers/intelligence.js';
import { getStatus, printStatus } from './status.js';
import { loadConfig } from './config.js';

const CONFIG_RELOAD_MS = 2000;

const ENGINE_DESCRIPTIONS = {
  trace: {
    on:  'intercepting agent commands — enforcing policy, writing receipts',
    off: 'receipt store not found — run your agent first to generate receipts',
  },
  recall: {
    on:  'connected — will load prior context and record blocked actions to memory',
    off: null, // filled dynamically from status.reason
  },
  intelligence: {
    on:  'connected — git commits and outbound network calls will be verified',
    off: null, // filled dynamically from status.reason
  },
};

function printStartupStatus(status, config) {
  console.log('\nStarting Transient...\n');

  const rows = [
    { name: 'Trace',         key: 'trace' },
    { name: 'Recall',        key: 'recall' },
    { name: 'Intelligence',  key: 'intelligence' },
  ];

  for (const { name, key } of rows) {
    const s = status[key];
    const label = name.padEnd(14);
    if (s.active) {
      console.log(`  ✓  ${label}  ${ENGINE_DESCRIPTIONS[key].on}`);
    } else {
      const reason = s.reason || ENGINE_DESCRIPTIONS[key].off || 'not available';
      console.log(`  –  ${label}  ${reason}`);
    }
  }

  console.log('');
}

export async function start(config) {
  // Check what is available
  const status = await getStatus(config);
  printStartupStatus(status, config);

  // Start receipt bus — the nervous system
  const bus = new ReceiptBus(config.trace.receipt_store);

  let liveConfig = config;
  let recall = null;
  let intelligence = null;

  const ensureRecall = async (cfg, reason = 'config reload') => {
    const enabled = !!cfg?.engines?.recall;

    if (!enabled) {
      if (recall) {
        bus.unregister(recall);
        recall = null;
        console.log(`[config] recall disabled (${reason})`);
      }
      return;
    }

    if (recall) return;

    const candidate = new RecallSubscriber(cfg.recall || {}, cfg.project);
    await candidate.init();
    if (!candidate.available) return;

    bus.register(candidate);
    recall = candidate;
    console.log(`[config] recall enabled (${reason})`);
  };

  const ensureIntelligence = async (cfg, reason = 'config reload') => {
    const enabled = !!cfg?.engines?.intelligence;

    if (!enabled) {
      if (intelligence) {
        bus.unregister(intelligence);
        intelligence = null;
        console.log(`[config] intelligence disabled (${reason})`);
      }
      return;
    }

    if (intelligence) return;

    const candidate = new IntelligenceSubscriber(cfg.intelligence || {});
    await candidate.init();
    if (!candidate.available) return;

    bus.register(candidate);
    intelligence = candidate;
    console.log(`[config] intelligence enabled (${reason})`);
  };

  const applyConfig = async (nextConfig, reason = 'config reload') => {
    if ((nextConfig?.trace?.receipt_store || '') !== (liveConfig?.trace?.receipt_store || '')) {
      bus.setReceiptStore(nextConfig.trace.receipt_store);
    }

    await ensureRecall(nextConfig, reason);
    await ensureIntelligence(nextConfig, reason);

    liveConfig = nextConfig;
  };

  // Initial subscriber wiring
  await applyConfig(liveConfig, 'startup');

  // Checkpoint on process exit (if recall is currently active)
  process.on('SIGINT', async () => {
    console.log('\n[recall] checkpointing session...');
    try {
      await recall?.checkpoint('exit', 'Transient session ended');
    } catch {}
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    try {
      await recall?.checkpoint('exit', 'Transient session ended');
    } catch {}
    process.exit(0);
  });

  // Hot-reload transient.config.json every 2s (no process restart required)
  let lastConfigJson = JSON.stringify(liveConfig);
  setInterval(async () => {
    try {
      const next = loadConfig();
      const nextJson = JSON.stringify(next);
      if (nextJson === lastConfigJson) return;

      console.log('[config] detected config change — applying live');
      await applyConfig(next, 'hot reload');
      lastConfigJson = nextJson;
    } catch (err) {
      console.error(`[config] reload failed: ${err.message}`);
    }
  }, CONFIG_RELOAD_MS);

  // Log all events to console in a readable format
  bus.on('event', (event) => {
    if (event.type === 'batch') {
      const { total, allowed, blocked, content, sessions } = event.batch;
      if (total > 0) {
        console.log(`[trace] ${allowed} allowed  ${blocked} blocked  ${content.length} content  ${sessions.size} session(s)`);
      }
    }
    if (event.type === 'blocked') {
      const action = event.receipt?.intent?.action || 'unknown';
      const reason = event.receipt?.decision?.reason_code || '';
      console.log(`[trace] ✗ BLOCKED  ${action}${reason ? ` — ${reason}` : ''}`);
    }
    if (event.type === 'content') {
      console.log(`[trace] ◆ ${event.action}`);
    }
    if (event.type === 'learning') {
      const { rule_id, action_class, tool_name, outcome, confidence, count } = event.receipt;
      const pct = confidence != null ? ` (${Math.round(confidence * 100)}% confidence, ${count} observations)` : '';
      console.log(`[learning] ◆ rule promoted → ${outcome} ${tool_name || action_class}${pct}`);
      console.log(`           rule id: ${rule_id}`);
    }
  });

  // Start watching
  bus.start();

  console.log('Transient is running. Watching for agent activity...');
  console.log('Live config reload: ON (transient.config.json)');
  console.log('Press Ctrl+C to stop and checkpoint session.\n');

  // Keep process alive
  process.stdin.resume();
}
