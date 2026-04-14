import { ReceiptBus } from './receipt-bus.js';
import { RecallSubscriber } from './subscribers/recall.js';
import { IntelligenceSubscriber } from './subscribers/intelligence.js';
import { getStatus, printStatus } from './status.js';

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

  // Connect Recall subscriber
  if (config.engines.recall) {
    const recall = new RecallSubscriber(config.recall, config.project);
    await recall.init();
    if (recall.available) {
      bus.register(recall);

      // Checkpoint on process exit
      process.on('SIGINT', async () => {
        console.log('\n[recall] checkpointing session...');
        await recall.checkpoint('exit', 'Transient session ended');
        process.exit(0);
      });
      process.on('SIGTERM', async () => {
        await recall.checkpoint('exit', 'Transient session ended');
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
    if (event.type === 'session_start') {
      console.log(`[trace] new session: ${event.sessionId}`);
    }
    if (event.type === 'action') {
      const outcome = event.receipt?.decision?.outcome || '?';
      const action = event.receipt?.intent?.action || 'unknown';
      const icon = outcome === 'allow' ? '✓' : '✗';
      console.log(`[trace] ${icon} ${outcome.padEnd(7)} ${action}`);
    }
    if (event.type === 'blocked') {
      const reason = event.receipt?.decision?.reason_code || '';
      console.log(`[trace] blocked: ${event.action} — ${reason}`);
    }
  });

  // Start watching
  bus.start();

  console.log('Transient is running. Watching for agent activity...');
  console.log('Press Ctrl+C to stop.\n');

  // Keep process alive
  process.stdin.resume();
}
