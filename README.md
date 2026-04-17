# Transient

Transient is the infrastructure which makes autonomous agents possible at scale.

Agents can act without humans in the loop today. What they cannot do is act accountably. Without a governance layer, there is no audit trail, no oversight, no recourse. You cannot deploy agents at scale without knowing what they did, what they were allowed to do, and why.

Transient fixes that at the infrastructure layer — not inside your agent, not in your prompt. Below both.

---

## Install

```bash
pip install transient-trace
```

```bash
transient-trace wrap install git curl npm pip3 uv --auto-rc
transient-trace wrap install-hook
```

```bash
transient-trace --mode strict --packages filesystem,code,privilege,shell run python agent.py
```

---

## What it gives you

Every agent action intercepted before execution. Every decision recorded as a tamper-evident receipt. Every blocked action remembered. Every content-producing action verified against intent.

The agent does not govern itself. The infrastructure does.

---

## How it works

```
Agent tries to act
        ↓
Transient intercepts before execution
        ↓
Policy evaluated — allow or deny
        ↓
Signed receipt written (Ed25519, tamper-evident)
        ↓
Memory indexes the event at the infrastructure layer
        ↓
Verification checks content-producing actions against declared intent
```

None of this requires changes to agent code.

---

## Built on an open protocol

Transient implements [ATP 1.0](https://github.com/james-transient/transient-atp) — the open standard for autonomous agent action governance. Every receipt follows the ATP specification and is independently verifiable by any party.

---

## Current limitations

macOS only. Linux in development. Windows not currently supported.

Strongest coverage for terminal-based agents. IDE extensions, browser interfaces, and GUI tools may not have full interception. Native Python network calls not covered at the socket level.

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
