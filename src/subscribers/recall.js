/**
 * recall.js — Receipt bus subscriber for Transient Recall
 *
 * Reacts to the receipt stream automatically:
 * - session_start → load context from Recall graph
 * - action → enrich graph with action patterns over time
 * - session end is detected externally via process monitoring
 */

export class RecallSubscriber {
  constructor(config, project) {
    this.endpoint = config.endpoint;
    this.subject = config.subject || 'local-dev-user';
    this.tenant = config.tenant || 'public';
    this.project = project;
    this.available = false;
  }

  async init() {
    try {
      const res = await fetch(`${this.endpoint}/healthz`, { signal: AbortSignal.timeout(3000) });
      this.available = res.ok;
      if (this.available) {
        console.log('[recall] connected');
      } else {
        console.log('[recall] not available — skipping');
      }
    } catch {
      console.log('[recall] not reachable — skipping');
      this.available = false;
    }
    return this;
  }

  onEvent(event) {
    if (!this.available) return;

    if (event.type === 'session_start') {
      this._loadContext(event.sessionId).catch(err =>
        console.error('[recall] context load failed:', err.message)
      );
    }

    if (event.type === 'blocked') {
      this._recordBlockedAction(event).catch(err =>
        console.error('[recall] record blocked failed:', err.message)
      );
    }
  }

  async checkpoint(sessionId, summary) {
    if (!this.available) return;
    await this._callTool('tr_checkpoint', {
      project: this.project,
      mode: 'ephemeral',
      work_packet: {
        current_goal: `Agent session ${sessionId}`,
        context_capsule: summary || 'Transient auto-checkpoint',
      },
    });
  }

  async _loadContext(sessionId) {
    console.log(`[recall] loading context for session ${sessionId}`);
    const result = await this._callTool('tr_resume', { project: this.project });
    if (result?.ok) {
      console.log('[recall] context loaded');
    }
  }

  async _recordBlockedAction(event) {
    const action = event.receipt?.intent?.action || 'unknown';
    const reason = event.receipt?.decision?.reason_code || 'unknown';
    console.log(`[recall] recording blocked action: ${action} (${reason})`);
  }

  async _callTool(toolName, args) {
    const res = await fetch(`${this.endpoint}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tr-subject': this.subject,
        'x-tr-tenant': this.tenant,
        'x-tr-project': this.project,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Recall API returned ${res.status}`);
    const data = await res.json();
    return data?.result;
  }
}
