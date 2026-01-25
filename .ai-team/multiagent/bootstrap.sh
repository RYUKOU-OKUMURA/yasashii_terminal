#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
INSTRUCTIONS_DIR="$SCRIPT_DIR/instructions"

log_info() { printf "[INFO] %s\n" "$1"; }
log_warn() { printf "[WARN] %s\n" "$1"; }
log_success() { printf "[OK] %s\n" "$1"; }

show_usage() {
  cat <<'MSG'
Usage:
  ./.ai-team/multiagent/bootstrap.sh [--delay <seconds>]

Options:
  --delay <seconds>  Wait before sending prompts (default: 2)
MSG
}

sleep_seconds=2

while [[ $# -gt 0 ]]; do
  case "$1" in
    --delay)
      sleep_seconds="$2"
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

send_prompt() {
  local target="$1"
  local file="$2"
  local buf_name="boot_$(basename "$file" .md)"

  tmux send-keys -t "$target" C-c
  sleep 0.2
  tmux load-buffer -b "$buf_name" "$file"
  tmux paste-buffer -t "$target" -b "$buf_name"
  tmux delete-buffer -b "$buf_name"
  tmux send-keys -t "$target" C-m
  sleep 0.2
}

check_sessions

if [ "$sleep_seconds" != "0" ]; then
  log_info "Waiting ${sleep_seconds}s before bootstrapping..."
  sleep "$sleep_seconds"
fi

log_info "Sending role prompts..."

send_prompt "multiagent:0.0" "$INSTRUCTIONS_DIR/boss.md"
send_prompt "multiagent:0.1" "$INSTRUCTIONS_DIR/worker.md"
send_prompt "multiagent:0.2" "$INSTRUCTIONS_DIR/worker.md"
send_prompt "multiagent:0.3" "$INSTRUCTIONS_DIR/worker.md"
send_prompt "multiagent:0.1" "$INSTRUCTIONS_DIR/worker1.md"
send_prompt "multiagent:0.2" "$INSTRUCTIONS_DIR/worker2.md"
send_prompt "multiagent:0.3" "$INSTRUCTIONS_DIR/worker3.md"

log_success "Bootstrap complete"
