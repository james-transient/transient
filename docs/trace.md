# Transient Trace

Governance at the OS layer. Intercepts every subprocess call before execution, evaluates it against policy, and writes a tamper-evident receipt. The agent cannot bypass it, modify it, or see past it.

Install: `pip install transient-trace`

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

In audit mode, receipts record what *would* have fired in strict mode — useful for understanding an agent's behaviour before enforcing rules.

---

## OWASP governance packages

Packages are curated rule sets aligned to the OWASP Agentic Security Initiative (ASI). Load with `--packages`:

```bash
transient-trace --mode strict --packages filesystem,code,privilege,shell run python agent.py
```

### `filesystem` — ASI-02

| Rule | Triggers when |
|------|---------------|
| Deny | `rm -rf`, `find -delete`, bulk delete |
| Deny | Delete target outside working directory |
| Challenge | Path contains `~/.ssh`, `~/.aws`, `/etc`, `/usr`, `/bin` |

### `code` — ASI-04

| Rule | Triggers when |
|------|---------------|
| Deny | `git push` to any remote |
| Deny | `pip install`, `npm install` without a lockfile flag |
| Challenge | Executing an unrecognised binary |

### `privilege` — ASI-03

| Rule | Triggers when |
|------|---------------|
| Deny | Any `sudo` invocation |
| Deny | Any `su` invocation |
| Deny | `chmod 777`, `chmod +s`, privilege escalation |
| Deny | `chown root` or `chown 0` |
| Deny | `useradd`, `userdel`, `usermod`, `passwd` |

### `shell` — ASI-04

| Rule | Triggers when |
|------|---------------|
| Deny | `curl \| bash`, `wget \| sh` |
| Deny | `eval` or `exec` with dynamic input |
| Challenge | `bash -c "..."`, `sh -c "..."` |
| Challenge | `python -c "..."`, `node -e "..."` |

### `web` — ASI-02

| Rule | Triggers when |
|------|---------------|
| Deny | URL targets `169.254.*`, `10.*`, `192.168.*`, `localhost` (SSRF) |
| Challenge | POST/PUT/PATCH/DELETE to any host |

### `messaging` — ASI-05

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

Every governed action produces a receipt — a tamper-evident JSON record signed with Ed25519:

```bash
transient-trace receipts summary
transient-trace receipts summary --since 1h
transient-trace receipts list
transient-trace receipts list --outcome deny
transient-trace receipts show <receipt-id>
```

Receipts are stored as individual JSON files in `~/transient-audit/receipts/`. The signature covers the full receipt payload — any modification breaks verification.

```bash
# Export a tamper-evident bundle
transient-trace export --out ./audit-bundle.json
```

---

## Persistent shims

Install shims once so governance is always active — no manual prefix needed:

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
