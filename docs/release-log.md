# Release log

This log explains what changed per public tag in this repository.

## v0.2.0a5 (2026-04-28)

Type: public release-note alignment for attestation + runtime hardening release line

What changed:
- Updated `README.md` under "Recent updates" with attestation feature note.
- Added note for `transient-trace verify` signed OWASP Agentic + EU AI Act attestation.

Why this tag exists:
- To align the public repository messaging with the new `transient-trace` bump (`v0.2.0a5`).
- To make the attestation capability visible in the public-facing repo.

Impact:
- Public documentation and release-note alignment only in this repository.
- Runtime/package implementation ships from `transient-trace` repository.

## v0.2.0a3 (2026-04-23)

Type: docs-only update (no package/runtime bump)

What changed:
- Updated `README.md` under "Recent updates".
- Replaced short bullet with:
  - "New TUI dashboard: You can watch your agents with live receipts, alter global configs, and change/add permissions."

Why this tag exists:
- To publish the README wording update in the public repo with a traceable release marker.
- This does **not** introduce a new SDK/runtime build.

Impact:
- No code-path changes.
- No policy/runtime behavior changes.
- Documentation clarity only.

## v0.2.0a2 (2026-04-23)

Type: release-alignment tag for public repo + README section addition

What changed:
- Added `README.md` section:
  - `## Recent updates`
  - `- New TUI dashboard`

Why this tag exists:
- To align the public repository release markers with the dashboard release line.

Impact:
- No code-path changes.
- No package/runtime behavior changes.
