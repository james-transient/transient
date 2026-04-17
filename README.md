# Transient

The trust infrastructure for autonomous agents.

Built on the [Agent Transaction Protocol (ATP)](https://github.com/james-transient/transient-atp).

---

Guardrails are instructions. Instructions live inside the thing you're trying to govern. It's like putting someone in handcuffs and giving them the key.

Transient is different. It intercepts at the infrastructure layer, before the action lands. The agent doesn't get a vote.

---

## What you get

Agents that are governed, auditable, and trustworthy without changing a single line of agent code.

Every action is intercepted before it executes. Every decision is recorded as a tamper-evident receipt. Every blocked action is remembered. Every content-producing action is verified against intent.

That's not a guardrail. That's infrastructure.

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

## What's happening underneath

Transient is three engines working together.

Governance intercepts every subprocess call before it executes and writes a tamper-evident receipt. Memory reads those receipts at the infrastructure layer and builds a knowledge graph of what your agent actually did. Verification listens passively and checks every content-producing action against declared intent.

None of it requires changes to your agent. None of it can be bypassed by your agent. All of it operates below the agent, not inside it.

---

## Protocol foundation

Transient implements [ATP 1.0](https://github.com/james-transient/transient-atp). Every receipt follows the ATP specification: `Intent`, `Decision`, `Receipt`. Signed with Ed25519. Independently verifiable.

ATP is an open protocol. Transient is the reference implementation.

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
