import { ReceiptBus } from './receipt-bus.js';
import { RecallSubscriber } from './subscribers/recall.js';
import { IntelligenceSubscriber } from './subscribers/intelligence.js';
import { getStatus, printStatus } from './status.js';
import { loadConfig } from './config.js';

const CONFIG_RELOAD_MS = 2000;

export async function start(config) {
  console.log('\nStarting Transient...\n');

  // Check what is available
  const status = await getStatus(config);
  printStatus(status);

  if (!status.trace.active) {
    console.log('Trace receipt store not found. Run your agent first to generate receipts.');
    console.log(`Expected location: ${config.trace.receipt_store}\n`);
  }

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
      const { total, allowed, blocked, sessions, content } = event.batch;
      if (total > 0) {
        console.log(`[trace] ${allowed} allowed  ${blocked} blocked  ${content.length} content  ${sessions.size} sessions`);
      }
    }
    if (event.type === 'blocked') {
      const action = event.receipt?.intent?.action || 'unknown';
      const reason = event.receipt?.decision?.reason_code || '';
      console.log(`[trace] ✗ BLOCKED  ${action} — ${reason}`);
    }
    if (event.type === 'content') {
      console.log(`[trace] ◆ ${event.action}`);
    }
  });

  // Start watching
  bus.start();

  console.log('Transient is running. Watching for agent activity...');
  console.log('Live config reload: ON (transient.config.json)');
  console.log('Press Ctrl+C to stop.\n');

  // Keep process alive
  process.stdin.resume();
}
