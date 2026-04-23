/**
 * receipt-bus.js
 *
 * Pull-based receipt processor. Polls the receipt store every 30 seconds
 * and dispatches batched events to subscribers.
 *
 * Pull not push — no matter how many receipts land per minute, subscribers
 * get called once per poll interval with a summary. This is robust on any
 * machine regardless of agent activity volume.
 */

import { readdirSync, readFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import EventEmitter from 'events';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export class ReceiptBus extends EventEmitter {
  constructor(receiptStore) {
    super();
    this.receiptStore = resolve(receiptStore);
    this.subscribers = [];
    this.lastProcessedTime = Date.now() - POLL_INTERVAL_MS; // process last 30s on startup
    this.timer = null;
  }

  start() {
    if (!existsSync(this.receiptStore)) {
      mkdirSync(this.receiptStore, { recursive: true });
    }

    console.log(`[receipt-bus] polling ${this.receiptStore} every 30s`);

    // Poll immediately then on interval
    this._poll();
    this.timer = setInterval(() => this._poll(), POLL_INTERVAL_MS);

    return this;
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  register(subscriber) {
    this.subscribers.push(subscriber);
  }

  unregister(subscriber) {
    this.subscribers = this.subscribers.filter(s => s !== subscriber);
  }

  setReceiptStore(receiptStore) {
    const next = resolve(receiptStore);
    if (next === this.receiptStore) return false;

    this.receiptStore = next;
    this.lastProcessedTime = Date.now() - POLL_INTERVAL_MS;

    if (!existsSync(this.receiptStore)) {
      mkdirSync(this.receiptStore, { recursive: true });
    }

    console.log(`[receipt-bus] switched receipt store -> ${this.receiptStore}`);
    return true;
  }

  _poll() {
    const since = this.lastProcessedTime;
    this.lastProcessedTime = Date.now();

    let files;
    try {
      files = readdirSync(this.receiptStore).filter(f => f.endsWith('.json'));
    } catch {
      return;
    }

    // Only process files newer than last poll
    const newFiles = files.filter(f => {
      try {
        const stat = statSync(join(this.receiptStore, f));
        return stat.mtimeMs > since;
      } catch {
        return false;
      }
    });

    if (newFiles.length === 0) return;

    const batch = {
      total: newFiles.length,
      allowed: 0,
      blocked: 0,
      content: [],
      sessions: new Set(),
      receipts: [],
    };

    for (const file of newFiles) {
      try {
        const receipt = JSON.parse(readFileSync(join(this.receiptStore, file), 'utf8'));
        batch.receipts.push(receipt);

        const outcome = receipt?.decision?.outcome || receipt?.receipt?.outcome;
        const action = receipt?.intent?.action || '';
        const actionClass = receipt?.intent?.action_class || '';
        const sessionId = receipt?.intent?.context?.runId || receipt?.intent?.context?.sessionId;

        if (sessionId) batch.sessions.add(sessionId);

        if (receipt?.type === 'learning_promoted') {
          this._notify({ type: 'learning', receipt });
          continue;
        }

        if (outcome === 'allow') batch.allowed++;
        if (outcome === 'deny' || receipt?.type === 'GovernanceDenyEvent') {
          batch.blocked++;
          this._notify({ type: 'blocked', action, actionClass, receipt });
        }

        if (outcome === 'allow' && this._isContentEvent(action, actionClass)) {
          batch.content.push({ action, actionClass, receipt });
        }
      } catch {
        // skip malformed
      }
    }

    // Dispatch batch summary
    this._notify({ type: 'batch', batch });

    // Dispatch content events
    for (const c of batch.content) {
      this._notify({ type: 'content', ...c });
    }

    console.log(`[receipt-bus] processed ${newFiles.length} receipts — ${batch.allowed} allowed, ${batch.blocked} blocked, ${batch.content.length} content events`);
  }

  _isContentEvent(action, actionClass) {
    const contentActions = ['git', 'curl', 'npm', 'pip', 'uv'];
    const contentClasses = ['write_low', 'write_high', 'exec', 'network'];
    return (
      contentActions.some(a => action.toLowerCase().includes(a)) ||
      contentClasses.includes(actionClass)
    );
  }

  _notify(event) {
    for (const sub of this.subscribers) {
      try {
        sub.onEvent(event);
      } catch (err) {
        console.error(`[receipt-bus] subscriber error:`, err.message);
      }
    }
    this.emit('event', event);
  }
}
