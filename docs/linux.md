# Linux setup

Transient runs on Ubuntu 22.04 LTS, Ubuntu 24.04 LTS, Debian 12+, and RHEL 9-family systems. The full governance stack — subprocess interception, Popen hook, receipts, and the TUI dashboard — is supported on all these platforms.

## Install

```bash
pipx install transient-trace
pipx ensurepath
source ~/.bashrc
```

`pipx ensurepath` adds `~/.local/bin` to your PATH. Run it once after install. If pipx is not installed:

```bash
sudo apt-get install -y pipx    # Ubuntu / Debian
sudo dnf install -y pipx        # RHEL / Fedora
```

## Quickstart

```bash
transient-trace wrap install git curl pip3 --auto-rc
source ~/.bashrc
transient-trace run python agent.py
```

## Shell support

Transient writes PATH and shim entries to your shell RC files automatically via `--auto-rc`. On Linux the following files are updated as applicable:

- `~/.bashrc`
- `~/.bash_profile`
- `~/.profile`

If you use a non-standard shell or a CI environment, add the shims directory to PATH manually:

```bash
export PATH="$HOME/.transient-trace/shims:$PATH"
```

## Notes

**Shim locking** — `transient-trace wrap install` locks shim files with `chattr +i` to prevent tampering. This requires root and an ext4 or xfs filesystem. In Docker containers running on overlayfs, locking silently no-ops. Governance and receipts are unaffected.

**Docker** — Transient works inside Docker containers. Run your agent through `transient-trace run` as normal. Shim locking is best-effort (see above).

**CI** — For CI pipelines, install via pipx in your workflow and launch your agent through `transient-trace run`. No additional configuration required.

```yaml
- name: Install transient-trace
  run: |
    pip install pipx
    pipx install transient-trace
    pipx ensurepath

- name: Run governed agent
  run: transient-trace run python agent.py
```

## Supported platforms

| Platform | Tested |
|---|---|
| Ubuntu 22.04 LTS (x86_64, ARM64) | Yes |
| Ubuntu 24.04 LTS | Yes |
| Debian 12+ | Yes (same glibc family) |
| RHEL 9 / Rocky 9 / Amazon Linux 2023 | Yes (manylinux wheel) |
| Alpine Linux (musl) | Not supported |
