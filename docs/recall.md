# Transient Recall

Memory at the infrastructure layer.

---

## What it is

Transient Recall indexes agent behaviour from Trace receipts — not from conversation history, not from agent logs, not from code instrumentation.

When an agent is blocked from pushing to production, that event is recorded in a Trace receipt. Recall reads that receipt and indexes it into a knowledge graph. The next session, Recall already knows what this agent tried, what was stopped, and what patterns have emerged.

None of this requires changes to your agent code. Recall operates on the governance record, not on the agent itself.

---

## How it connects to Trace

Recall receives events from the Transient receipt bus. The bus polls the Trace receipt store every 30 seconds and dispatches batches to Recall:

- **Session start** — Recall loads prior context from the knowledge graph
- **Blocked action** — Recall records the block, action type, and reason
- **Session end** — Recall checkpoints the session summary

```
Trace receipt → receipt bus → Recall subscriber → knowledge graph
```

---

## What gets indexed

Recall indexes at the governance layer:

- What actions were attempted
- What was blocked and why
- What patterns recur across sessions
- What the agent was trying to do when governance intervened

This is fundamentally different from application-level memory. Recall doesn't know what the agent said — it knows what the agent did and what the infrastructure stopped.

---

## Configuration

In `transient.config.json`:

```json
{
  "recall": {
    "endpoint": "http://localhost:8090",
    "subject": "local-dev-user",
    "tenant": "public"
  }
}
```

Start the receipt bus to connect Recall to Trace automatically:

```bash
npm start
```

---

## Coming soon

Transient Recall is in active development. Public documentation and SDK will be available at launch.

Stay tuned for agents you can trust.
