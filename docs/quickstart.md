# Quickstart

Get your agent governed in under five minutes.

---

## 1. Install Transient Trace

```bash
pipx install transient-trace
```

`pipx` installs into an isolated environment and puts `transient-trace` on PATH permanently. If you don't have pipx: `brew install pipx && pipx ensurepath`.

---

## 2. Set up governance shims

Shims intercept binaries at the OS level. Every call to `git`, `curl`, `npm` etc. from any agent, script, or tool on the machine goes through governance first.

```bash
transient-trace wrap install git curl npm pip3 uv --auto-rc
transient-trace wrap install-hook
```

Verify everything is wired up:

```bash
transient-trace wrap status
which git   # should return ~/.transient-trace/shims/git
```

---

## 3. Boot your agent through Transient

Transient requires you to launch your agent through it. You do not run your agent directly you run it via `transient-trace run`. This is how the governance layer wraps the process.

```bash
transient-trace run python agent.py
```

```bash
transient-trace run claude
```

Every session must be started this way. Launching an agent directly without `transient-trace run` means there is no session context, no linked receipt chain, and no popen hook. Permanent shims will still intercept specific binaries but the receipts are unconnected. For full governance, always start through `transient-trace run`.

That's it. Every action the agent takes is now intercepted, evaluated, and receipted.

---

## 4. Add OWASP governance packages

Packages are curated rule sets aligned to the OWASP Agentic Security Initiative. Load them to enforce specific security boundaries:

```bash
transient-trace --mode strict --packages filesystem,code,privilege,shell run python agent.py
```

| Package | Blocks |
|---------|--------|
| `filesystem` | Bulk delete, sensitive paths (`~/.ssh`, `/etc`) |
| `code` | `git push` to remote, package installs without lockfile |
| `privilege` | `sudo`, `su`, chmod escalation, user management |
| `shell` | `curl \| bash`, `eval`, inline code execution |
| `web` | SSRF, mutation requests to internal hosts |
| `messaging` | External email, broadcast to unknown recipients |

---

## 5. View receipts

Every governed action produces a tamper-evident receipt:

```bash
transient-trace receipts summary
transient-trace receipts list
transient-trace receipts list --outcome deny
```

---

## Governance modes

| Mode | Behaviour |
|------|-----------|
| `audit` | Record everything. Never block. Default. |
| `strict` | Block on policy violations before execution. |
| `permissive` | Log violations. Never block. |

Set strict as the permanent default:

```bash
transient-trace config set mode strict
```

---

## Connect Recall and Intelligence (optional)

If you're running Transient Recall or Transient Intelligence, start the receipt bus to connect them to Trace automatically:

```bash
cp transient.config.example.json transient.config.json
# Edit transient.config.json with your Recall and Intelligence endpoints
npm install
npm start
```

The receipt bus polls Trace receipts every 30 seconds and dispatches events to Recall and Intelligence no agent code changes required.

---

## Next steps

- [How it works](how-it-works.md) architecture, interception model, trust boundary
- [Transient Trace](trace.md) policies, packages, receipts, CLI reference
- [Transient Recall](recall.md) infrastructure-level memory
- [Troubleshooting](troubleshooting.md) common issues and fixes
