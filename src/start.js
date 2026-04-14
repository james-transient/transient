import { ReceiptBus } from './receipt-bus.js';
import { RecallSubscriber } from './subscribers/recall.js';
import { IntelligenceSubscriber } from './subscribers/intelligence.js';
import { getStatus, printStatus } from './status.js';

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

  // Connect Recall subscriber
  if (config.engines.recall) {
    const recall = new RecallSubscriber(config.recall, config.project);
    await recall.init();
    if (recall.available) {
      bus.register(recall);

      // Checkpoint on process exit
      process.on('SIGINT', async () => {
        console.log('\n[recall] checkpointing session...');
        try { await recall.checkpoint('exit', 'Transient session ended'); } catch {}
        process.exit(0);
      });
      process.on('SIGTERM', async () => {
        try { await recall.checkpoint('exit', 'Transient session ended'); } catch {}
        process.exit(0);
      });
    }
  }

  // Connect Intelligence subscriber
  if (config.engines.intelligence) {
    const intelligence = new IntelligenceSubscriber(config.intelligence);
    await intelligence.init();
    if (intelligence.available) {
      bus.register(intelligence);
    }
  }

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

  console.log('Watching for agent activity. Receipts processed every 30s.');
  console.log('Press Ctrl+C to stop and checkpoint session.\n');

  // Keep process alive
  process.stdin.resume();
}
