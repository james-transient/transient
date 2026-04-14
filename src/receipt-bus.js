/**
 * receipt-bus.js
 *
 * The core of the unified Transient wrapper.
 *
 * Watches the Trace receipt store for new receipts using OS-level FSEvents
 * (macOS) or inotify (Linux) via chokidar. Every new receipt is parsed and
 * dispatched to registered subscribers.
 *
 * Recall and Intelligence never need to be called by the agent. They subscribe
 * here and react automatically to the receipt stream.
 */

import { watch } from 'chokidar';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import EventEmitter from 'events';

export class ReceiptBus extends EventEmitter {
  constructor(receiptStore) {
    super();
    this.receiptStore = resolve(receiptStore);
    this.watcher = null;
    this.subscribers = [];
    this.seenSessions = new Set();
  }

  start() {
    if (!existsSync(this.receiptStore)) {
      mkdirSync(this.receiptStore, { recursive: true });
    }

    console.log(`[receipt-bus] watching ${this.receiptStore}`);

    this.watcher = watch(this.receiptStore, {
      persistent: true,
      ignoreInitial: true,  // only react to new receipts, not existing ones on startup
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 20,
      },
    });

    this.watcher.on('add', (filePath) => {
      if (!filePath.endsWith('.json')) return;
      this._dispatch(filePath);
    });

    this.watcher.on('error', (err) => {
      console.error('[receipt-bus] watcher error:', err);
    });

    return this;
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  register(subscriber) {
    this.subscribers.push(subscriber);
  }

  _dispatch(filePath) {
    let receipt;
    try {
      receipt = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`[receipt-bus] failed to parse receipt ${filePath}:`, err.message);
      return;
    }

    const sessionId = receipt?.intent?.context?.sessionId;
    const isNewSession = sessionId && !this.seenSessions.has(sessionId);

    if (isNewSession) {
      this.seenSessions.add(sessionId);
      this._notify({ type: 'session_start', sessionId, receipt });
    }

    this._notify({ type: 'action', receipt });

    // Content events — file writes, git operations, network requests
    const action = receipt?.intent?.action || '';
    const actionClass = receipt?.intent?.action_class || '';
    const outcome = receipt?.decision?.outcome;

    if (outcome === 'allow' && this._isContentEvent(action, actionClass)) {
      this._notify({ type: 'content', action, actionClass, receipt });
    }

    if (outcome === 'deny' || receipt?.type === 'GovernanceDenyEvent') {
      this._notify({ type: 'blocked', action, actionClass, receipt });
    }
  }

  _isContentEvent(action, actionClass) {
    const contentActions = ['git', 'write', 'curl', 'npm', 'pip', 'uv'];
    const contentClasses = ['write_low', 'write_high', 'network_egress'];
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
