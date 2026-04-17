#!/bin/bash
# Transient — install script
# Installs Transient Trace and sets up governance shims.

set -e

echo ""
echo "Installing Transient Trace..."
echo ""

# Install transient-trace
if command -v pipx &>/dev/null; then
  pipx install transient-trace
else
  pip install transient-trace
fi

echo ""
echo "Setting up governance shims..."
echo ""

# Install shims for common binaries
transient-trace wrap install git curl npm pip3 uv --auto-rc

# Install Popen hook for Python subprocesses
transient-trace wrap install-hook

echo ""
echo "Transient Trace installed."
echo ""
echo "Verify:"
echo "  transient-trace --help"
echo "  transient-trace wrap status"
echo ""
echo "Start governing an agent:"
echo "  transient-trace run python agent.py"
echo "  transient-trace --mode strict --packages filesystem,code,privilege,shell run python agent.py"
echo ""
