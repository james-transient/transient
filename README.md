# Transient

The trust layer for autonomous agents.

Built on the [Agent Transaction Protocol (ATP)](https://github.com/james-transient/transient-atp) — the open protocol specification for autonomous agent action governance.

---

Guardrails are instructions. Instructions live inside the thing you're trying to govern. It's like putting someone in handcuffs and giving them the key.

Real governance intercepts at the infrastructure layer, before the action lands. The agent doesn't get a vote.

Transient is three components that work together below the agent — not inside it.

---

## The three layers

**[Transient Trace](https://pypi.org/project/transient-trace/)** — Governance at the OS layer. Intercepts every subprocess call before execution. Evaluates against policy. Writes tamper-evident receipts. The agent cannot bypass it, modify it, or see past it.

**Transient Recall** — Memory at the infrastructure layer. Reads Trace receipts directly — not agent logs, not conversation history. Indexes blocked actions, patterns, and session context into a knowledge graph. No agent code required.

**Transient Intelligence** — Verification at the infrastructure layer. Listens passively to Trace receipts. Triggers on content-producing actions — git commits, network requests, file writes. Verifies against declared intent. Never interrupts the agent's flow.

---

## Install

```bash
pip install transient-trace
```

Set up governance shims:

```bash
transient-trace wrap install git curl npm pip3 uv --auto-rc
transient-trace wrap install-hook
```

Start the receipt bus (connects Trace to Recall and Intelligence):

```bash
cp transient.config.example.json transient.config.json
# edit transient.config.json with your endpoints
npm install
npm start
```

---

## How it works

Trace writes a receipt every time a governed action executes. The receipt bus polls the Trace receipt store every 30 seconds and dispatches events to Recall and Intelligence.

```
Agent action
    ↓
Transient Trace intercepts — evaluates policy — writes receipt
    ↓
Receipt bus picks it up
    ↓
Recall indexes it          Intelligence verifies it
(infrastructure memory)    (infrastructure verification)
```

None of this requires changes to your agent code.

---

## Governance modes

| Mode | Behaviour |
|------|-----------|
| `audit` | Record everything. Never block. Default. |
| `strict` | Block on policy violations before execution. |
| `permissive` | Log violations. Never block. |

Run an agent in strict mode with OWASP governance packages:

```bash
transient-trace --mode strict --packages filesystem,code,privilege,shell run python agent.py
```

---

## Receipts

Every governed action produces a tamper-evident receipt signed with Ed25519:

```bash
transient-trace receipts summary
transient-trace receipts list --outcome deny
```

Recall indexes these receipts at the infrastructure layer — not from agent conversation, not from logs. From the governance layer itself.

---

## Protocol foundation

Transient Trace implements [ATP 1.0](https://github.com/james-transient/transient-atp) — the Agent Transaction Protocol. ATP defines the canonical model for governed agent actions:

| Object | What it represents |
|--------|-------------------|
| `Intent` | The declared action the agent wants to perform |
| `Decision` | The governance outcome: `allow` or `deny` |
| `Receipt` | The immutable, cryptographically signed record of the action and its outcome |

Every receipt Trace produces follows the ATP specification. Receipts are signed with Ed25519 and independently verifiable — no dependency on the issuing system. ATP is an open protocol. Transient Trace is the reference implementation.

---

## Current limitations

Transient Trace is tested and supported on **macOS only**. Linux is in development. Windows is not currently supported.

Coverage is strongest for terminal-based agents. Agents that run through IDE extensions, browser-based interfaces, or GUI tools may not have full subprocess interception. Native Python network calls (urllib, requests, httpx) are not intercepted at the socket level — only subprocess calls are covered.

This is early software. For production use, pair Transient with additional controls: network proxy, container isolation, OS-level firewall.

Full details: [How it works — limitations](docs/how-it-works.md#whats-not-covered)

---

## Docs

- [Quickstart](docs/quickstart.md)
- [How it works](docs/how-it-works.md)
- [Transient Trace](docs/trace.md) — governance, OWASP packages, uninstall
- [Transient Recall](docs/recall.md)
- [CLI Reference](docs/cli-reference.md)
- [Troubleshooting](docs/troubleshooting.md)

---

Stay tuned for agents you can trust.
