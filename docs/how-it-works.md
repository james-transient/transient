# How It Works

Transient operates at the infrastructure layer — below your agent code, below your prompts, below your guardrails. This page explains the architecture and how the three engines connect.

---

## The problem with guardrails

Guardrails are instructions. Instructions live inside the thing you're trying to govern.

An agent with a system prompt saying "don't push to production" can still push to production. The instruction and the agent that might ignore it are in the same process. It's like putting someone in handcuffs and giving them the key.

Real governance intercepts before the action executes — at the infrastructure layer, where the agent has no vote.

---

## The three engines

```
┌─────────────────────────────────────────────────────────┐
│  Your agent (Claude, Hermes, any Python/Node runtime)   │
└──────────────────────┬──────────────────────────────────┘
                       │ tries to act
┌──────────────────────▼──────────────────────────────────┐
│  Transient Trace                                         │
│  Intercepts → Evaluates policy → Writes receipt         │
│  The agent cannot bypass, modify, or see past this.     │
└──────────┬──────────────────────────┬───────────────────┘
           │ receipts                 │ receipts
┌──────────▼──────────┐  ┌───────────▼───────────────────┐
│  Transient Recall   │  │  Transient Intelligence        │
│  Indexes blocked    │  │  Verifies content-producing    │
│  actions, patterns, │  │  actions against declared      │
│  and session        │  │  intent. Never interrupts      │
│  context into a     │  │  the agent's flow.             │
│  knowledge graph.   │  │                                │
└─────────────────────┘  └────────────────────────────────┘
```

None of this requires changes to your agent code. Everything operates on receipts — not on the agent's conversation or internal state.

---

## Transient Trace — governance at the OS layer

Trace intercepts actions at two levels:

**PATH shims** — thin scripts written to `~/.transient-trace/shims/`. When an agent calls `git push`, the shell resolves `git` to the shim first. The shim evaluates the action against policy before the real binary ever runs.

**Popen hook** — a Python monkey-patch on `subprocess.Popen` that catches absolute-path subprocess calls (`/usr/bin/git`), which bypass PATH entirely. Installed via a `.pth` file in Python's site-packages.

Every intercepted action goes through the same pipeline:

```
Action intercepted
    ↓
sense_maker classifies it (read / write_low / write_high / delete / network)
    ↓
Policy Enforcement Point evaluates rules
    ↓
Allow → real binary executes → signed receipt written (Ed25519)
Deny  → action blocked       → unsigned deny event written
```

Receipts are signed with Ed25519 and cannot be modified after the fact.

---

## Transient Recall — memory at the infrastructure layer

Recall doesn't read agent conversation history. It doesn't instrument your code. It reads Trace receipts directly — the governance record of what your agent actually did versus what it was allowed to do.

Blocked actions, behaviour patterns, and session context are indexed into a knowledge graph. Infrastructure-level memory: what the agent tried, what was stopped, what patterns emerged — independent of what the agent reported about itself.

---

## Transient Intelligence — verification at the infrastructure layer

Intelligence listens passively to the Trace receipt stream. When a content-producing action executes — a git commit, a network request, a file write — Intelligence verifies it against the agent's declared intent.

The agent does not call Intelligence. Intelligence watches the governance layer and triggers automatically. Results surface in the dashboard, not in the agent's flow.

---

## The receipt bus

The receipt bus connects the three engines. It polls the Trace receipt store every 30 seconds and dispatches events to Recall and Intelligence:

```
Trace receipt store (~/transient-audit/receipts/)
    ↓ polled every 30s
Receipt bus
    ↓ dispatches events
Recall subscriber      Intelligence subscriber
```

Pull-based, not push-based. No matter how many receipts land per minute, subscribers receive a batched summary once per poll interval.

---

## Trust boundary

The operator sets governance policy before launching the agent:

```bash
export TRANSIENT_TRACE_MODE=strict
export TRANSIENT_TRACE_POLICY_JSON='{"version":1,"defaultAction":"deny","rules":[...]}'
transient-trace run python agent.py
```

These values are locked at Client initialisation time. The agent cannot override `MODE` or `POLICY_JSON` after the process starts — even if it writes to the environment.

---

## What's covered

| Path | Example |
|---|---|
| Shell-resolved binary (PATH shim) | `git push`, `curl https://...` |
| Python subprocess by absolute path (Popen hook) | `/usr/bin/git push` from Python |
| Inherited child Python processes | Nested agents, tool runners |

## What's not covered

| Path | Why |
|---|---|
| Native network calls (urllib, requests, httpx) | No socket-level hook |
| Node.js `child_process` with absolute paths | Popen hook is Python-only |
| Binaries not in the shim set | Only shimmed binaries are intercepted |

For complete network coverage, pair Transient with a network proxy or eBPF-based egress filter at the OS level.
