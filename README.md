# Transient

Without governance, the agentic economy is chaos.

Agents can act without humans in the loop. They can write code, make purchases, call APIs, push to production, move money. The missing piece is not capability. It is governance: a standardised way to record what an agent was authorised to do, what decision was made, and what happened — in a form that is tamper-evident and independently verifiable.

Without that, you cannot audit an agent, hold a system accountable, or safely delegate anything that matters to an autonomous process.

Transient is that infrastructure.

---

## The problem

Every agent action today happens without a checkpoint.

No interception. Agents act without oversight, accessing systems and executing operations with no governance layer between intent and action.

No audit trail. There is no tamper-evident record of what was decided, what was allowed, and what was blocked.

No oversight. There is no human notification at critical boundaries — privilege escalation, production deployments, external network calls.

No recourse. When something goes wrong, there is no receipt, no accountability, no way to reconstruct what happened and why.

This is not a tooling problem. It is an infrastructure problem.

---

## What Transient does

Transient intercepts at the infrastructure layer — not inside your agent, not inside your prompt, below both.

Every agent action passes through a governance checkpoint before it reaches any downstream system. Every decision produces a signed, immutable receipt. Every pattern is remembered across sessions. Every content-producing action is verified against declared intent.

The result: confidence, control, and compliance by design.

Not because the agent is asked to behave. Because the infrastructure enforces it.

---

## How it works

```
Agent tries to act
        ↓
Transient intercepts before execution
        ↓
Policy evaluated: allow or deny
        ↓
Signed receipt written (tamper-evident, Ed25519)
        ↓
Memory indexes the event
        ↓
Verification checks content-producing actions against intent
```

None of this requires changes to agent code. None of it can be bypassed by the agent. The agent does not govern itself. The infrastructure does.

---

## Get started

```bash
pip install transient-trace
```

```bash
transient-trace wrap install git curl npm pip3 uv --auto-rc
transient-trace wrap install-hook
```

Run your agent under governance:

```bash
transient-trace --mode strict --packages filesystem,code,privilege,shell run python agent.py
```

---

## Built on an open protocol

Transient implements [ATP 1.0](https://github.com/james-transient/transient-atp) — the Agent Transaction Protocol. The open standard for autonomous agent action governance.

Every governed action produces three canonical objects: `Intent` (what the agent declared), `Decision` (allow or deny), `Receipt` (the signed, immutable record). Receipts are independently verifiable by any party with no dependency on the issuing system.

The protocol is open. The standard is open. Anyone can implement it. Transient is the reference implementation.

---

## Current limitations

Tested and supported on macOS only. Linux is in development. Windows is not currently supported.

Coverage is strongest for terminal-based agents. Agents running through IDE extensions, browser interfaces, or GUI tools may not have full interception. Native Python network calls are not covered at the socket level.

Full details: [How it works](docs/how-it-works.md)

---

## Docs

- [Quickstart](docs/quickstart.md)
- [How it works](docs/how-it-works.md)
- [Governance](docs/trace.md)
- [Memory](docs/recall.md)
- [Verification](docs/intelligence.md)
- [CLI Reference](docs/cli-reference.md)
- [Troubleshooting](docs/troubleshooting.md)

---

Stay tuned for agents you can trust.
