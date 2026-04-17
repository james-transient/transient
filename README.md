# Transient

Autonomous agents are here. The infrastructure to trust them isn't.

Agents can act without humans in the loop. They can write code, make purchases, call APIs, push to production, move money. What's missing is not capability. It's accountability.

Without a way to verify what an agent did, why it did it, and whether it was authorised to do it, there is no agentic economy. There is just risk.

Transient is the trust infrastructure layer for autonomous agents.

---

Guardrails are instructions. Instructions live inside the thing you're trying to govern. It's like putting someone in handcuffs and giving them the key.

Transient intercepts at the infrastructure layer, before the action lands. The agent doesn't get a vote, and doesn't need to be asked nicely.

---

## What Transient gives you

Every agent action intercepted before execution. Every decision recorded as a tamper-evident receipt. Every pattern remembered across sessions. Every content-producing action verified against declared intent.

Governance, memory, and verification. None of it inside the agent. None of it dependent on the agent behaving. All of it operating below the agent, at the infrastructure layer, where it cannot be bypassed.

This is what makes agents trustworthy enough to deploy. Trustworthy enough to transact. Trustworthy enough to matter.

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

Transient implements [ATP 1.0](https://github.com/james-transient/transient-atp) — the Agent Transaction Protocol. Every governed action produces three canonical objects: `Intent`, `Decision`, `Receipt`. Signed with Ed25519. Independently verifiable by any party.

The protocol is open. Anyone can implement it. Transient is the reference implementation.

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
