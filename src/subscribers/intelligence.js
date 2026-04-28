/**
 * intelligence.js — Receipt bus subscriber for Transient Intelligence
 *
 * Reacts to content events in the receipt stream:
 * - git commits/pushes → verify the diff against declared intent
 * - file writes → verify written content
 * - network requests → flag outbound payloads
 *
 * The agent does not call Intelligence. Intelligence listens to Trace receipts
 * and triggers automatically on content-producing events.
 *
 * API key: set TRANSIENT_INTELLIGENCE_API_KEY env var or intelligence.api_key
 * in transient.config.json.
 */

const TI_ANSWER_PATH = '/api/models/v1/answer';
const MAX_ANSWER_RETRIES = 3;

function sanitizePromptValue(value, maxLen = 200) {
  const normalized = String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.slice(0, maxLen);
}

export class IntelligenceSubscriber {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.apiKey = config.api_key || process.env.TRANSIENT_INTELLIGENCE_API_KEY || '';
    this.config = config;
    this.available = false;
  }

  async init() {
    if (!this.apiKey) {
      console.log('[intelligence] no API key — set TRANSIENT_INTELLIGENCE_API_KEY to enable');
      return this;
    }

    const healthPath = this.config?.health_path || '/api/health';
    try {
      const res = await fetch(`${this.endpoint}${healthPath}`, {
        headers: { 'x-api-key': this.apiKey },
        signal: AbortSignal.timeout(5000),
      });
      // Accept 200 or 404 — either means the server is up; 401/403 means bad key
      if (res.status === 401 || res.status === 403) {
        console.log('[intelligence] API key rejected — check TRANSIENT_INTELLIGENCE_API_KEY');
        return this;
      }
      this.available = true;
      console.log('[intelligence] connected');
    } catch {
      console.log('[intelligence] not reachable — skipping');
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
    } else if (actionClass === 'network') {
      this._verifyNetworkAction(receipt).catch(err =>
        console.error('[intelligence] network verify failed:', err.message)
      );
    }
  }

  async _verifyGitAction(receipt) {
    const command = receipt?.intent?.target?.command || '';
    if (!command.includes('git commit') && !command.includes('git push')) return;
    const safeCommand = sanitizePromptValue(command, 120);

    const evidence = JSON.stringify({
      action: receipt?.intent?.action,
      command,
      target: receipt?.intent?.target,
      context: receipt?.intent?.context,
      outcome: receipt?.decision?.outcome,
      timestamp: receipt?.created_at,
    });

    console.log(`[intelligence] verifying git action: ${safeCommand.slice(0, 80)}`);

    const result = await this._answer(
      evidence,
      `Is this git action (${safeCommand}) consistent with the agent's declared goal? ` +
      'Does it modify files outside the expected scope? ' +
      'Are there any signs of privilege escalation or policy bypass attempts?'
    );

    if (result) {
      const confidence = result.factual_confidence?.label || 'unknown';
      const summary = result.answer?.summary || '';
      console.log(`[intelligence] git verdict: ${confidence} — ${summary.slice(0, 120)}`);
    }
  }

  async _verifyNetworkAction(receipt) {
    const host = receipt?.intent?.target?.host || '';
    const command = receipt?.intent?.target?.command || '';
    if (!host && !command) return;

    const evidence = JSON.stringify({
      action: receipt?.intent?.action,
      target: receipt?.intent?.target,
      context: receipt?.intent?.context,
      outcome: receipt?.decision?.outcome,
      timestamp: receipt?.created_at,
    });

    console.log(`[intelligence] verifying network action: ${host || command.slice(0, 60)}`);

    const result = await this._answer(
      evidence,
      `Is this outbound network request to ${host} expected for the agent's declared task? ` +
      'Is it sending data that should not leave the local environment?'
    );

    if (result) {
      const confidence = result.factual_confidence?.label || 'unknown';
      const summary = result.answer?.summary || '';
      console.log(`[intelligence] network verdict: ${confidence} — ${summary.slice(0, 120)}`);
    }
  }

  async _answer(input, question, sessionId = null) {
    const safeQuestion = sanitizePromptValue(question, 1000);
    let attempt = 0;
    let nextSessionId = sessionId;
    let nextInput = input;

    while (attempt <= MAX_ANSWER_RETRIES) {
      const body = { question: safeQuestion, top_k: 5 };
      if (nextSessionId) {
        body.session_id = nextSessionId;
      } else {
        body.input = nextInput;
      }

      const res = await fetch(`${this.endpoint}${TI_ANSWER_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.error(`[intelligence] API returned ${res.status}`);
        return null;
      }

      const data = await res.json();

      if (data.mode !== 'answer_wait_then_retry') {
        return data;
      }

      attempt += 1;
      if (attempt > MAX_ANSWER_RETRIES) {
        console.warn('[intelligence] max retry attempts reached; skipping verification');
        return null;
      }

      const waitMs = Math.min(Math.max((data.retry_after_seconds || 10) * 1000, 250), 30_000);
      await new Promise((r) => setTimeout(r, waitMs));
      nextSessionId = data.session_id || nextSessionId;
      nextInput = null;
    }

    return null;
  }
}
