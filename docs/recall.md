# Transient Recall

Memory at the infrastructure layer.

---

## What it does

Every AI agent is stateless by design. Each session starts blind — no memory of what it tried last time, what was blocked, what patterns emerged. Recall fixes this, but not by reading conversation history or agent logs.

Recall reads Trace receipts directly. The governance record — what the agent did, what was allowed, what was blocked, and why — gets indexed into a knowledge graph. The next session, that history is available. Not from what the agent said about itself. From what the infrastructure recorded.

---

## Why this matters

An agent can tell you anything. The governance layer cannot lie.

When an agent is blocked from pushing to production, Recall indexes that event from the receipt — not from the agent's self-report. When the same pattern recurs across sessions, Recall knows. When a new session starts, Recall loads that history and the agent begins with full context of what governance has seen.

This is infrastructure-level memory. It cannot be manipulated by the agent, because the agent never touches it.

---

## How it connects to Trace

The Transient receipt bus polls the Trace receipt store every 30 seconds and dispatches events to Recall:

- **Session start** — Recall loads prior context from the knowledge graph
- **Blocked action** — Recall records the action, reason, and pattern
- **Session end** — Recall checkpoints the session summary

```
Agent action
    ↓
Trace intercepts → writes receipt
    ↓
Receipt bus picks it up
    ↓
Recall indexes it (from governance layer, not from agent)
```

Configure in `transient.config.json`:

```json
{
  "recall": {
    "endpoint": "http://localhost:8090",
    "subject": "local-dev-user",
    "tenant": "public"
  }
}
```

Then `npm start` — Recall connects automatically.

---

## What gets remembered

- What actions each agent attempted
- What was blocked and under which policy rule
- Patterns that recur across sessions
- Session context and goals at the point governance intervened
- The full arc of what an agent did over time

None of this comes from the agent. All of it comes from Trace.

---

Transient Recall is part of the Transient suite. It is not available as a standalone product.
