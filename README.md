<p align="center">
  <img src="media/logo.svg" alt="Transient" width="400" />
</p>

<p align="center">
<strong>The trust infrastructure for autonomous agents.</strong>
</p>

<p align="center">
<a href="#"><img src="https://img.shields.io/badge/license-proprietary-red.svg" /></a>
<a href="https://pypi.org/project/transient-trace/"><img src="https://img.shields.io/pypi/v/transient-trace.svg" /></a>
<a href="https://github.com/james-transient/transient-atp"><img src="https://img.shields.io/badge/protocol-ATP%201.0-green.svg" /></a>
</p>

<p align="center">
<em>Created and maintained by <a href="https://transientintelligence.com">Transient Intelligence Ltd</a></em>
</p>

---

```bash
pipx install transient-trace
```

<video src="media/demo.mp4" autoplay loop muted width="100%"></video>

Autonomous agents can now act without a human in the loop: write code, push to production, call APIs, make purchases, move money. The missing piece is not capability. It is accountability.

Without a governance layer, there is no audit trail, no interception, no recourse. You cannot deploy agents at scale without knowing what they did, what they were authorised to do, and why. Guardrails inside the agent are not governance. They are instructions and instructions live inside the thing you are trying to govern.

Transient is the first governance layer that operates outside the agent process. No code changes required. The agent cannot disable it, route around it, or see past it.

## What Transient does

Transient intercepts at the infrastructure layer outside the agent process, below the application layer and produces tamper-evident receipts for every governed action.

| Capability | What it provides |
|------------|-----------------|
| **Governance** | Every subprocess call intercepted before execution. Policy evaluated. Action allowed or denied. |
| **Receipts** | Every decision recorded as an immutable, Ed25519-signed receipt. Independently verifiable. |
| **Memory** | Blocked actions, patterns, and session context indexed from the governance layer not from agent logs. |
| **Verification** | Content-producing actions verified against declared intent. Asynchronous. Non-blocking. |

None of this requires changes to agent code. None of it can be bypassed by the agent.

## Getting started

```bash
pipx install transient-trace
```

Install governance shims:

```bash
transient-trace wrap install git curl npm pip3 uv --auto-rc
transient-trace wrap install-hook
```

Boot your agent through Transient. Every session must be launched via `transient-trace run` this is how the governance layer wraps the process:

```bash
transient-trace --mode strict --packages filesystem,code,privilege,shell run python agent.py
```

```bash
transient-trace run claude
```

View the audit trail:

```bash
transient-trace receipts summary
transient-trace receipts list --outcome deny
```

## OWASP governance packages

Transient ships curated rule sets aligned to the OWASP Agentic Security Initiative:

| Package | Blocks |
|---------|--------|
| `filesystem` | Bulk delete, sensitive paths (`~/.ssh`, `/etc`) |
| `code` | `git push` to remote, unverified package installs |
| `privilege` | `sudo`, `su`, chmod escalation, user management |
| `shell` | `curl \| bash`, `eval`, inline code execution |
| `web` | SSRF, mutation requests to internal hosts |
| `messaging` | External broadcast, unknown recipients |

## Protocol foundation

Transient implements [ATP 1.0](https://github.com/james-transient/transient-atp) the open protocol specification for autonomous agent action governance. Every governed action produces three canonical objects:

| Object | What it represents |
|--------|-------------------|
| `Intent` | The declared action the agent wants to perform |
| `Decision` | The governance outcome: `allow` or `deny` |
| `Receipt` | The immutable, cryptographically signed record |

Receipts are signed with Ed25519 and independently verifiable by any party with no dependency on the issuing system. ATP is an open protocol. Transient is the reference implementation.

## Intended use

Transient is designed for teams building or deploying autonomous agents who need:

- Infrastructure-level governance that cannot be bypassed by the agent
- A tamper-evident audit trail for compliance and accountability
- Memory and verification that operate from the governance layer, not the application layer

## Current limitations

Tested and supported on macOS only. Linux is in development. Windows is not currently supported.

Coverage is strongest for terminal-based agents. Agents running through IDE extensions, browser interfaces, or GUI tools may not have full interception. Native Python network calls are not covered at the socket level.

For complete coverage in production environments, pair Transient with a network proxy or OS-level egress filter.

## Documentation

- [Quickstart](docs/quickstart.md)
- [How it works](docs/how-it-works.md)
- [Governance](docs/trace.md)
- [Memory](docs/recall.md)
- [Verification](docs/intelligence.md)
- [CLI Reference](docs/cli-reference.md)
- [Troubleshooting](docs/troubleshooting.md)

## Licence

Proprietary. All rights reserved. © 2026 Transient Intelligence Ltd.

---

Stay tuned for agents you can trust.
