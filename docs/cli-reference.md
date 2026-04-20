# CLI Reference

```
transient-trace [--mode MODE] [--state-dir DIR] [--policy JSON] [--packages LIST] <command>
```

## Global flags

| Flag | Default | Description |
|------|---------|-------------|
| `--mode` | `audit` | Governance mode: `strict`, `audit`, or `permissive` |
| `--state-dir` | `~/transient-audit` | Where receipts and the engine DB are stored |
| `--policy` | | Inline JSON governance policy |
| `--packages` | | Comma-separated governance package names |

Set permanently with `transient-trace config set`.

---

## `wrap` persistent governance shims

### `wrap install <binary>`

```bash
transient-trace wrap install git curl npm pip3 uv --auto-rc
transient-trace wrap install git --lock
transient-trace wrap install git --real /usr/bin/git
```

| Flag | Description |
|------|-------------|
| `--auto-rc` | Add shims dir to PATH in `~/.zshrc` / `~/.bashrc` / `~/.zshenv` |
| `--lock` | Set OS-level immutability on the shim (`chflags uchg` on macOS) |
| `--real PATH` | Path to the real binary (auto-detected if omitted) |

### `wrap uninstall <binary>`

```bash
transient-trace wrap uninstall git
```

### `wrap status`

```bash
transient-trace wrap status
```

### `wrap install-hook`

```bash
transient-trace wrap install-hook
transient-trace wrap install-hook --uninstall
```

Installs the subprocess intercept so Python processes using absolute binary paths are governed. Requires `TRANSIENT_TRACE_HOOK=1` in the environment to activate.

---

## `run` governed session

```bash
transient-trace run python agent.py
transient-trace --mode strict run python agent.py
transient-trace --mode strict --packages filesystem,code,privilege,shell run claude
transient-trace run --learning python agent.py
transient-trace run --shim mybin:/usr/bin/mybin python agent.py
```

| Flag | Description |
|------|-------------|
| `--shim NAME:PATH` | Add an extra binary to the shim set |
| `--learning` | Enable self-learning receipt engine |

---

## `receipts` browse the audit trail

### `receipts list`

```bash
transient-trace receipts list
transient-trace receipts list --outcome deny
transient-trace receipts list --since 1h
transient-trace receipts list --since 2026-04-13T09:00 --until 2026-04-13T17:00
transient-trace receipts list --run-id run_abc123
transient-trace receipts list --action-class network
transient-trace receipts list --json
```

### `receipts summary`

```bash
transient-trace receipts summary
transient-trace receipts summary --since 1h
transient-trace receipts summary --run-id run_abc123 --json
```

JSON output is designed for agent self-check:

```json
{
  "run_id": "run_abc123",
  "total": 10,
  "deny_rate": 0.2,
  "denied_actions": [
    { "action": "curl", "action_class": "network", "rule_id": "policy_default" }
  ]
}
```

### `receipts show <id>`

```bash
transient-trace receipts show TR-01KP36JKZ10XCVGQ6N3G1DKNH3
```

### `receipts index`

```bash
transient-trace receipts index
```

Backfills the engine DB from JSON receipt files.

---

## `config` persistent defaults

```bash
transient-trace config show
transient-trace config set mode strict
transient-trace config set mode audit
transient-trace config set state_dir ~/my-audit
transient-trace config set packages filesystem,code,privilege,shell
```

| Key | Description |
|-----|-------------|
| `mode` | Default governance mode |
| `state_dir` | Where receipts are stored |
| `packages` | Default packages loaded every session |

---

## `explain` audit report

```bash
transient-trace explain
transient-trace explain --action-class network
```

---

## `export` tamper-evident bundle

```bash
transient-trace export
transient-trace export --out ./audit-2026-04-13.json
```

---

## `uninstall`

```bash
transient-trace uninstall
transient-trace uninstall --purge-data
```

Removes all shims, PATH entries, and the subprocess intercept. `--purge-data` also removes config and receipts.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `TRANSIENT_TRACE_MODE` | Governance mode overrides config |
| `TRANSIENT_TRACE_POLICY_JSON` | Inline policy JSON |
| `TRANSIENT_TRACE_STATE_DIR` | State dir |
| `TRANSIENT_TRACE_RUN_ID` | Set by `run` unique session ID |
| `TRANSIENT_TRACE_PARENT_RUN_ID` | Set when a governed process runs another governed process |
| `TRANSIENT_TRACE_LEARNING` | `1` to enable self-learning |
| `TRANSIENT_TRACE_PACKAGES` | Comma-separated package names |
| `TRANSIENT_TRACE_HOOK` | `1` to activate the subprocess intercept |

`MODE` and `POLICY_JSON` are locked at Client initialisation an agent cannot override them after the process starts.
