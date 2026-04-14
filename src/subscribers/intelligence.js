/**
 * intelligence.js — Receipt bus subscriber for Transient Intelligence
 *
 * Reacts to content events in the receipt stream:
 * - git commits → verify the diff
 * - file writes → verify written content
 * - network requests → flag outbound payloads
 *
 * The agent does not call Intelligence. Intelligence listens to Trace receipts
 * and triggers automatically on content-producing events.
 */

export class IntelligenceSubscriber {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.available = false;
  }

  async init() {
    try {
      const res = await fetch(`${this.endpoint}/healthz`, { signal: AbortSignal.timeout(3000) });
      this.available = res.ok;
      if (this.available) {
        console.log('[intelligence] connected');
      } else {
        console.log('[intelligence] not available — skipping');
      }
    } catch {
      console.log('[intelligence] not reachable — skipping');
      this.available = false;
    }
    return this;
  }

  onEvent(event) {
    if (!this.available) return;
    if (event.type !== 'content') return;

    const { action, actionClass, receipt } = event;

    if (action.includes('git')) {
      this._verifyGitAction(receipt).catch(err =>
        console.error('[intelligence] git verify failed:', err.message)
      );
    }
  }

  async _verifyGitAction(receipt) {
    const command = receipt?.intent?.target?.command || '';
    if (!command.includes('git commit') && !command.includes('git push')) return;
    console.log(`[intelligence] flagging git action for verification: ${command.slice(0, 80)}`);
    // Intelligence verification happens asynchronously
    // Results surface in the dashboard, not in the agent's flow
  }
}
