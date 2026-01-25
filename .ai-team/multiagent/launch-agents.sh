#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

log_info() { printf "[INFO] %s\n" "$1"; }
log_warn() { printf "[WARN] %s\n" "$1"; }
log_success() { printf "[OK] %s\n" "$1"; }

show_usage() {
  cat <<'MSG'
Usage:
  ./.ai-team/multiagent/launch-agents.sh [--yes] [--cmd "<command>"]

Options:
  --yes          Skip confirmation prompt
  --cmd "..."    Command to run in each pane (default: claude --dangerously-skip-permissions)
MSG
}

confirm=true
cmd="claude --dangerously-skip-permissions"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)
      confirm=false
      shift
      ;;
    --cmd)
      cmd="$2"
      shift 2
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

check_sessions() {
  local ok=true
  if ! tmux has-session -t president 2>/dev/null; then
    log_warn "president session not found"
    ok=false
  fi
  if ! tmux has-session -t multiagent 2>/dev/null; then
    log_warn "multiagent session not found"
    ok=false
  fi
  if [ "$ok" = false ]; then
    echo "Run ./.ai-team/multiagent/setup.sh first"
    exit 1
  fi
}

launch_agent() {
  local target="$1"
  local name="$2"
  log_info "Launching $name"
  tmux send-keys -t "$target" "$cmd" C-m
  sleep 0.2
}

check_sessions

if [ "$confirm" = true ]; then
  read -r -p "Launch agents in all panes? (y/N): " ans
  if [[ ! "$ans" =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
  fi
fi

launch_agent "president" "PRESIDENT"
launch_agent "multiagent:0.0" "boss1"
launch_agent "multiagent:0.1" "worker1"
launch_agent "multiagent:0.2" "worker2"
launch_agent "multiagent:0.3" "worker3"

log_success "Launch commands sent"
