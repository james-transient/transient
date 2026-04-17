# Transient Intelligence

Verification at the infrastructure layer.

---

## What it does

Transient Intelligence listens passively to the Trace receipt stream. When a content-producing action executes a git commit, a network request, a file write Intelligence verifies it against the agent's declared intent.

The agent does not call Intelligence. Intelligence never interrupts the agent's flow. It watches the governance layer and triggers automatically. Results surface in the dashboard, not in the agent's path.

---

## Why this matters

An agent can commit code it was never asked to write. It can make network requests to destinations it shouldn't know about. It can write files outside the scope of the task. These actions all produce receipts. Intelligence reads those receipts and asks: does what the agent just did match what it was supposed to do?

This is evidence-first verification. Not a prompt asking the agent to reflect on its behaviour. Not a heuristic. A structured check against declared intent, run after the fact, grounded in what the governance layer actually recorded.

---

## How it connects to Trace

The Transient receipt bus dispatches content events to Intelligence:

- **Git commit or push** Intelligence verifies the action against the agent's declared goal
- **Network request** Intelligence checks whether the destination and payload are consistent with the task
- **File write** Intelligence flags writes outside expected scope

```
Agent action
    ↓
Trace intercepts → writes receipt
    ↓
Receipt bus dispatches content event
    ↓
Intelligence verifies against declared intent
(asynchronous agent flow is never interrupted)
```

Configure in `transient.config.json`:

```json
{
  "intelligence": {
    "endpoint": "http://localhost:8080",
    "health_path": "/api/health"
  }
}
```

Then run `npm start`. Intelligence connects automatically.

---

## What gets verified

- Git commits and pushes are they consistent with the declared task?
- Outbound network requests expected destination? Expected payload?
- File writes within expected scope?

Verification is asynchronous and non-blocking. The action has already been allowed or denied by Trace. Intelligence adds a second layer of scrutiny after the fact not as a gate, but as an audit signal.

---

## The evidence-first approach

Intelligence uses the same evidence-first, citation-grounded model that underpins the Transient Intelligence platform. Every verification is grounded in what the receipt actually recorded not synthesised from assumptions. If the evidence doesn't support a verdict, no verdict is given.

---

Transient Intelligence is part of the Transient suite. It is not available as a standalone product.
