/**
 * recall.js — Receipt bus subscriber for Transient Recall
 *
 * Reacts to the receipt stream automatically:
 * - first batch → load prior context from Recall graph (once per process)
 * - blocked → checkpoint blocked action to Recall graph for pattern analysis
 * - session end → checkpoint via SIGINT/SIGTERM handler in start.js
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

    // Load context once per process lifetime on first batch arrival.
    // receipt-bus never emits session_start — we use first batch instead.
    if (event.type === 'batch' && !this._contextLoaded) {
      this._contextLoaded = true;
      const sessionId = event.batch?.sessions
        ? [...event.batch.sessions][0] || 'unknown'
        : 'unknown';
      this._loadContext(sessionId).catch(() => {});
    }

    // Record blocked actions to Recall graph for pattern analysis
    if (event.type === 'blocked') {
      this._recordBlockedAction(event).catch(() => {});
    }
  }

  async checkpoint(sessionId, summary) {
    if (!this.available) return;
    await this._callTool('tr_checkpoint', {
      project: this.project,
      scope: 'transient-session',
      mode: 'ephemeral',
      work_packet: {
        current_goal: `Agent session ${sessionId} ended`,
        context_capsule: summary || 'Transient auto-checkpoint on session exit',
        summary_brief: summary || 'Transient session ended cleanly',
      },
    });
  }

  async _loadContext(sessionId) {
    console.log(`[recall] loading context for session ${sessionId}`);
    try {
      const result = await this._callTool('tr_resume', {
        project: this.project,
        scope: 'transient-session',
      });
      if (result?.ok) {
        console.log('[recall] context loaded');
      }
    } catch {
      // No prior context for this session — that is fine
    }
  }

  async _recordBlockedAction(event) {
    const action = event.receipt?.intent?.action || 'unknown';
    const reason = event.receipt?.decision?.reason_code || 'unknown';
    const command = event.receipt?.intent?.target?.command || '';
    console.log(`[recall] recording blocked: ${action} — ${reason}`);
    await this._callTool('tr_checkpoint', {
      project: this.project,
      scope: 'transient-blocked',
      mode: 'ephemeral',
      work_packet: {
        current_goal: `Blocked action: ${action}`,
        context_capsule: `Action '${action}' was blocked. Reason: ${reason}. Command: ${command}`,
        summary_brief: `Blocked: ${action} (${reason})`,
      },
    });
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
