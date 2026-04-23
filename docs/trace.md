# Transient Trace

Governance at the OS layer. Intercepts every subprocess call before execution, evaluates it against policy, and writes a tamper-evident receipt. The agent cannot bypass it, modify it, or see past it.

Install: `pip install transient-trace`

GitHub repositories:
- Transient Trace (implementation): https://github.com/james-transient/transient-trace
- ATP open protocol (spec): https://github.com/james-transient/transient-atp

---

## Governance modes

| Mode | Behaviour |
|------|-----------|
| `audit` | Record everything. Never block. Default. |
| `strict` | Block on policy violations before execution. |
| `permissive` | Log violations. Never block. |

```bash
# Run in strict mode
transient-trace --mode strict run python agent.py

# Set as permanent default
transient-trace config set mode strict
```

In audit mode, receipts record what *would* have fired in strict mode useful for understanding an agent's behaviour before enforcing rules.

---

## OWASP governance packages

Packages are curated rule sets aligned to the [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/). Load with `--packages`:

```bash
transient-trace --mode strict --packages filesystem,code,privilege,shell run python agent.py
```

### `filesystem`

| Rule | Triggers when |
|------|---------------|
| Deny | `rm -rf`, `find -delete`, bulk delete |
| Deny | Delete target outside working directory |
| Challenge | Path contains `~/.ssh`, `~/.aws`, `/etc`, `/usr`, `/bin` |

### `code`

| Rule | Triggers when |
|------|---------------|
| Deny | `git push` to any remote |
| Deny | `pip install`, `npm install` without a lockfile flag |
| Challenge | Executing an unrecognised binary |

### `privilege`

| Rule | Triggers when |
|------|---------------|
| Deny | Any `sudo` invocation |
| Deny | Any `su` invocation |
| Deny | `chmod 777`, `chmod +s`, privilege escalation |
| Deny | `chown root` or `chown 0` |
| Deny | `useradd`, `userdel`, `usermod`, `passwd` |

### `shell`

| Rule | Triggers when |
|------|---------------|
| Deny | `curl \| bash`, `wget \| sh` |
| Deny | `eval` or `exec` with dynamic input |
| Challenge | `bash -c "..."`, `sh -c "..."` |
| Challenge | `python -c "..."`, `node -e "..."` |

### `web`

| Rule | Triggers when |
|------|---------------|
| Deny | URL targets `169.254.*`, `10.*`, `192.168.*`, `localhost` (SSRF) |
| Challenge | POST/PUT/PATCH/DELETE to any host |

### `messaging`

| Rule | Triggers when |
|------|---------------|
| Deny | Bulk send to unknown external recipients |
| Deny | Message class is `alert` or `notification` |
| Challenge | Sending to broadcast topology |
| Challenge | Recipient domain not in allowlist |

---

## Self-protection

Two rules are hardcoded and cannot be overridden:

- `pip uninstall transient-trace` → always denied
- `uv remove transient-trace` → always denied

An agent cannot remove its own governance layer from within a governed session.

---

## Writing policies

A policy is a JSON object that tells Trace what to allow and what to block:

```json
{
  "version": 1,
  "defaultAction": "deny",
  "rules": [
    {
      "id": "allow-git-reads",
      "action": "allow",
      "actionClasses": ["read"]
    },
    {
      "id": "allow-anthropic-api",
      "action": "allow",
      "actionClasses": ["network"],
      "hosts": ["api.anthropic.com"]
    }
  ]
}
```

`defaultAction` applies to anything not matched by a rule. Use `"deny"` for an allowlist posture, `"allow"` for a blocklist posture.

### Action classes

| Class | Examples |
|-------|---------|
| `read` | `git status`, `git log`, read-only ops |
| `write_low` | `git commit`, `git push` |
| `write_high` | High-risk write operations |
| `delete` | File deletion, destructive ops |
| `network` | `curl`, `wget`, HTTP requests |

### Passing a policy

```bash
# Inline
transient-trace --mode strict --policy '{"version":1,"defaultAction":"deny","rules":[]}' run python agent.py

# Environment variable
export TRANSIENT_TRACE_POLICY_JSON='{"version":1,"defaultAction":"deny","rules":[]}'

# File (auto-loaded from .atp/policy.json)
mkdir -p .atp && cat > .atp/policy.json << 'EOF'
{"version":1,"defaultAction":"deny","rules":[]}
EOF
```

### Policy precedence (highest → lowest)

1. `TRANSIENT_TRACE_POLICY_JSON` env var
2. `--policy` CLI flag
3. `ATP_POLICY_PATH` env var
4. `.atp/policy.json` in working directory
5. Built-in allow-all default

---

## Receipts

Every governed action produces a tamper-evident JSON receipt signed with Ed25519:

```bash
transient-trace receipts summary
transient-trace receipts summary --since 1h
transient-trace receipts list
transient-trace receipts list --outcome deny
transient-trace receipts show <receipt-id>
```

Receipts are stored as individual JSON files in `~/transient-audit/receipts/`. The signature covers the full receipt payload. Any modification breaks verification.

```bash
# Export a tamper-evident bundle
transient-trace export --out ./audit-bundle.json
```

---

## Persistent shims

Install shims once so governance is always active. No manual prefix needed:

```bash
transient-trace wrap install git curl npm pip3 uv --auto-rc
transient-trace wrap install-hook
```

Add OS-level immutability so a running agent cannot delete its own shim:

```bash
transient-trace wrap install git --lock
```

Check status:

```bash
transient-trace wrap status
```

---

## Self-learning engine

Run with `--learning` to let Trace analyse receipt history and suggest governance rules based on what your agent actually does:

```bash
transient-trace --learning run python agent.py
transient-trace receipts learning
```

Useful for generating a tailored policy from observed behaviour rather than writing rules from scratch.

---

## Uninstall

### Clean uninstall (keeps config and receipts)

```bash
transient-trace uninstall
```

Removes all shims, the subprocess intercept, and the PATH entry from shell RC files. Your receipts and config are preserved.

### Full purge (removes everything)

```bash
transient-trace uninstall --purge-data
```

Also removes `~/.config/transient-trace/` and `~/transient-audit/`.

### If uninstall is blocked by immutability

If you used `--lock` when installing shims, unlock first:

```bash
chflags -R nouchg ~/.config/transient-trace ~/.transient-trace 2>/dev/null; true
transient-trace uninstall --purge-data
```

### Manual cleanup (if CLI is unavailable)

```bash
# Remove shims
rm -rf ~/.transient-trace/shims

# Remove subprocess intercept
transient-trace uninstall  # handles intercept removal automatically

# Remove PATH entry from shell RC
# Edit ~/.zshrc and ~/.zshenv manually to remove the transient-trace shims line

# Remove pipx package
pipx uninstall transient-trace

# Remove config and receipts (optional)
rm -rf ~/.config/transient-trace ~/transient-audit
```

---

## Current limitations

**Platform support**

Transient Trace is currently tested and supported on **macOS (Apple Silicon and Intel)**. Linux support is in development. Windows is not currently supported.

**Coverage gaps**

| Path | Status |
|------|--------|
| Terminal subprocess calls (PATH-resolved) | ✓ Covered by shims |
| Python subprocess with absolute path | ✓ Covered by subprocess intercept |
| Native Python network calls (urllib, requests, httpx) | ✗ Not intercepted |
| Node.js `child_process` with absolute paths | ✗ Not intercepted |
| GUI applications and non-terminal agent interfaces | ✗ Not intercepted |
| Agents that invoke binaries via IDE extensions or browser automation | ✗ Not intercepted |
| Actions taken by processes running as root | ✗ Shim dir may not be in root's PATH |

If your agent runs through a non-terminal interface an IDE extension, a browser-based tool, a custom GUI subprocess calls may bypass the PATH shim layer entirely. The subprocess intercept will still catch Python subprocess calls with absolute paths, but there is no coverage for other runtimes.

**This is early software.** The governance layer is functional and tested on macOS, but production use should include additional controls (network proxy, OS-level firewall, container isolation) for complete coverage.
