<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="media/banner-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="media/banner-light.png">
    <img alt="Transient" src="media/banner-light.png" width="500" />
  </picture>
</p>

<p align="center">
<strong>The trust infrastructure for autonomous agents.</strong>
</p>

<p align="center">
<a href="LICENSE"><img src="https://img.shields.io/badge/license-proprietary-red.svg" /></a>
<a href="https://pypi.org/project/transient-trace/"><img src="https://img.shields.io/pypi/v/transient-trace.svg" /></a>
<a href="https://github.com/james-transient/transient-atp"><img src="https://img.shields.io/badge/protocol-ATP%201.0-green.svg" /></a>
</p>

---

```bash
pipx install transient-trace
```

<video src="media/demo.mp4" autoplay loop muted width="100%"></video>

Autonomous agents can now act without a human in the loop: write code, push to production, call APIs, make purchases, move money. The missing piece is not capability. It is accountability.

Without a governance layer, there is no audit trail, no interception, no recourse. You cannot deploy agents at scale without knowing what they did, what they were authorised to do, and why. Guardrails inside the agent are not governance. They are instructions and instructions live inside the thing you are trying to govern.

Transient is a governance layer that operates outside the agent process. No sandbox. No framework coupling. It intercepts at the process boundary, outside the agent and below the framework. Every governed action produces a tamper-evident receipt before it reaches the system. Receipts are signed with Ed25519 and independently verifiable by any party with no dependency on the issuing system. The agent cannot disable it, route around it, or see past it.

| Capability | What it provides |
|------------|-----------------|
| **Governance** | Every subprocess call intercepted before execution. Policy evaluated. Action allowed or denied. |
| **Receipts** | Every decision recorded as an immutable, Ed25519-signed receipt. Independently verifiable. |
| **Memory** | Blocked actions, patterns, and session context indexed from the governance layer not from agent logs. |
| **Verification** | Content-producing actions verified against declared intent. Asynchronous. Non-blocking. |

None of this requires changes to agent code. None of it can be bypassed by the agent.

## Recent updates

- [New TUI dashboard](docs/dashboard.md): You can watch your agents with live receipts, alter global configs, and change/add permissions.

## Getting started

Transient is the product. `transient-trace` is the CLI that powers the governance layer. Install it with:

```bash
pipx install transient-trace
```

Install governance shims:

```bash
transient-trace wrap install git curl npm pip3 uv sudo --auto-rc
source ~/.zshrc
```

Boot your agent through Transient. Every session must be launched via `transient-trace run`. This is how the governance layer wraps the process:

```bash
transient-trace run claude
transient-trace --mode strict --packages filesystem,code,privilege,shell run python agent.py
```

If no mode is specified, Transient runs in `audit` mode by default. It records everything but never blocks. Transient runs in three modes:

| Mode | Behaviour |
|------|-----------|
| `audit` | Records everything. Never blocks. Default. Use this to observe what your agent does before enforcing rules. |
| `strict` | Blocks on policy violations before the action executes. Use this for production governance. |
| `permissive` | Logs violations but never blocks. Use this for testing policy rules. |

Set a mode permanently:

```bash
transient-trace config set mode strict
```

View the audit trail:

```bash
transient-trace receipts summary
transient-trace receipts list --outcome deny
```

## Governance packages

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

## How Transient runs

Transient wraps your agent process. You launch your agent through `transient-trace run`. That is how the governed session is created, the receipt chain is started, and subprocess interception is activated.

```bash
transient-trace run python agent.py
transient-trace run claude
transient-trace --mode strict --packages filesystem,code,privilege,shell run python agent.py
```

Launching an agent directly without `transient-trace run` means there is no session context and no linked receipt chain. Permanent shims will still intercept specific binaries, but the receipts are unconnected. For full governance, always start through `transient-trace run`.

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
- [Dashboard (TUI)](docs/dashboard.md)

## Repository structure

```
transient-trace     → install via pipx (the governance CLI)
src/                → receipt bus — connects Trace receipts to Recall and Intelligence
docs/               → full documentation
```

`transient-trace` is the entry point. The receipt bus runs alongside it and feeds governed actions into Recall (memory) and Intelligence (verification) in real time.

## Licence

[Transient Software License Agreement](LICENSE). © 2026 Transient Intelligence Ltd.

Free during alpha for evaluation and feedback. Free alpha access does not constitute a commitment to provide the software free of charge after the alpha phase ends. Commercial licensing will be introduced at general availability.

---
