# Troubleshooting

Common issues and fixes.

---

## Installation

### `zsh: command not found: transient-trace`

The pipx binary isn't on PATH. Add `~/.local/bin` to PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Add to `~/.zshrc` to make it permanent. Or use pipx's built-in fix:

```bash
pipx ensurepath
```

---

### `multiple .dist-info directories found`

macOS creates `._*` resource fork files on exFAT/FAT32 external drives. These confuse pip during wheel building.

Fix — install directly from PyPI instead:

```bash
pipx install transient-trace
```

Or if building from source, strip the resource forks first:

```bash
python3 -c "import shutil; shutil.copytree('/path/to/source', '/tmp/tt-src', ignore=shutil.ignore_patterns('._*'))"
pipx install /tmp/tt-src
```

---

### `bad interpreter: no such file or directory` on git shim

The shim was installed with a Python interpreter path that no longer exists (e.g. after reinstalling transient-trace under a different package name).

Fix — reinstall the shims:

```bash
transient-trace wrap install git curl npm pip3 uv
```

---

## Governance

### Commands are being blocked unexpectedly

Check what governance is recording:

```bash
transient-trace receipts list --outcome deny
```

If you're in strict mode and want to observe without blocking:

```bash
transient-trace config set mode audit
```

Or run a single session in audit mode without changing the default:

```bash
transient-trace --mode audit run python agent.py
```

---

### `BLOCKED: git — Denied: policy_default`

The policy's `defaultAction` is `deny` and no rule is allowing this action. Either add an allow rule for the action or switch to audit mode to understand what's being blocked before writing rules.

---

### `Operation not permitted` on uninstall

The config directory or shim files have OS-level immutability set (`chflags uchg` on macOS). Clear it first:

```bash
chflags -R nouchg ~/.config/transient-trace
transient-trace uninstall --purge-data
```

---

### Shim PATH not active for non-interactive shells

The shims directory was added to `~/.zshrc` but not to `~/.zshenv`. Non-interactive shells (Claude Code subprocesses, cron, background scripts) source `.zshenv` but not `.zshrc`.

Fix:

```bash
echo 'export PATH="$HOME/.transient-trace/shims:$HOME/.local/bin:$PATH"' >> ~/.zshenv
```

---

## Receipt bus

### `[recall] not reachable — skipping`

Recall isn't running or the endpoint in `transient.config.json` is wrong. The bus continues without Recall — Trace governance is unaffected.

Check your Recall endpoint:

```bash
curl http://localhost:8090/healthz
```

---

### `[intelligence] not available — skipping`

Intelligence server isn't reachable. Same as above — Trace governance continues unaffected. Check your Intelligence endpoint configuration in `transient.config.json`.

---

## Full clean reinstall

If things are in a broken state, start fresh:

```bash
# 1. Unlock any immutable files
chflags -R nouchg ~/.config/transient-trace ~/.transient-trace 2>/dev/null; true

# 2. Clean uninstall
transient-trace uninstall --purge-data

# 3. Remove pipx package
pipx uninstall transient-trace

# 4. Reinstall
pipx install transient-trace

# 5. Reinstall shims and hook
transient-trace wrap install git curl npm pip3 uv --auto-rc
transient-trace wrap install-hook
```
