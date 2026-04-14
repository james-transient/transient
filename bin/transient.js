#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig } from '../src/config.js';
import { start } from '../src/start.js';
import { getStatus, printStatus } from '../src/status.js';

const program = new Command();

program
  .name('transient')
  .description('The trust layer for autonomous agents')
  .version('0.1.0');

program
  .command('start')
  .description('Start Transient — watches receipt stream, connects Recall and Intelligence')
  .action(async () => {
    const config = loadConfig();
    await start(config);
  });

program
  .command('status')
  .description('Show which engines are running')
  .action(async () => {
    const config = loadConfig();
    const status = await getStatus(config);
    printStatus(status);
  });

program
  .command('receipts')
  .description('Show recent receipts from Trace')
  .option('-n, --count <n>', 'number of receipts to show', '10')
  .action(async (opts) => {
    const config = loadConfig();
    const { readdirSync, readFileSync, existsSync } = await import('fs');
    const store = config.trace.receipt_store;
    if (!existsSync(store)) {
      console.log(`No receipts found at ${store}`);
      return;
    }
    const files = readdirSync(store)
      .filter(f => f.endsWith('.json'))
      .sort()
      .slice(-parseInt(opts.count));

    console.log(`\nLast ${files.length} receipts:\n`);
    for (const file of files) {
      try {
        const r = JSON.parse(readFileSync(`${store}/${file}`, 'utf8'));
        const outcome = r?.decision?.outcome || r?.receipt?.outcome || '?';
        const action = r?.intent?.action || 'unknown';
        const time = r?.created_at?.slice(11, 19) || '';
        const icon = outcome === 'allow' ? '✓' : '✗';
        console.log(`  ${icon} ${time}  ${outcome.padEnd(7)}  ${action}`);
      } catch {
        // skip malformed
      }
    }
    console.log('');
  });

program.parse();
