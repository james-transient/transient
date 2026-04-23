# Dashboard (TUI)

The Transient dashboard is a terminal UI for live governance visibility and control.

## What it gives you

- Live receipt stream as actions are intercepted and decided
- Global governance config controls (mode, policy surface)
- Permission/rule updates for active operations

## Launch

```bash
transient-trace dashboard
```

Optional state directory:

```bash
transient-trace dashboard --state-dir ~/transient-audit
```

## Core usage

- Watch receipts in real time while agents run
- Inspect allow/deny/challenge outcomes and reason codes
- Update global config when operating posture changes
- Add or modify permission/rule settings without leaving the dashboard

## Key controls

- `q` quit
- `h` help
- `r` refresh
- `m` mode

(Exact controls may evolve per release; use in-app help as source of truth.)

## Safety note

Dashboard config/rule changes affect governance behavior immediately for active sessions and future actions.
Use strict mode when unattended, and switch posture deliberately when supervising.
