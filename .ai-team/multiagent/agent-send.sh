#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
LOG_FILE="$SCRIPT_DIR/logs/send_log.txt"

get_agent_target() {
  case "$1" in
    president) echo "president" ;;
    boss1) echo "multiagent:0.0" ;;
    worker1) echo "multiagent:0.1" ;;
    worker2) echo "multiagent:0.2" ;;
    worker3) echo "multiagent:0.3" ;;
    *) echo "" ;;
  esac
}

show_usage() {
  cat <<'MSG'
Usage:
  ./.ai-team/multiagent/agent-send.sh <agent> "<message>"
  ./.ai-team/multiagent/agent-send.sh --list

Agents:
  president, boss1, worker1, worker2, worker3
MSG
}

show_agents() {
  cat <<'MSG'
Available agents:
  president -> president
  boss1     -> multiagent:0.0
  worker1   -> multiagent:0.1
  worker2   -> multiagent:0.2
  worker3   -> multiagent:0.3
MSG
}

log_send() {
  local agent="$1"
  local message="$2"
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  mkdir -p "$SCRIPT_DIR/logs"
  printf "[%s] %s: SENT - \"%s\"\n" "$timestamp" "$agent" "$message" >> "$LOG_FILE"
}

send_message() {
  local target="$1"
  local message="$2"

  tmux send-keys -t "$target" C-c
  sleep 0.2
  tmux send-keys -t "$target" "$message"
  tmux send-keys -t "$target" C-m
  sleep 0.2
}

check_target() {
  local target="$1"
  local session_name="${target%%:*}"

  if ! tmux has-session -t "$session_name" 2>/dev/null; then
    echo "Session '$session_name' not found"
    return 1
  fi
  return 0
}

main() {
  if [[ $# -eq 0 ]]; then
    show_usage
    exit 1
  fi

  if [[ "$1" == "--list" ]]; then
    show_agents
    exit 0
  fi

  if [[ $# -lt 2 ]]; then
    show_usage
    exit 1
  fi

  local agent_name="$1"
  local message="$2"

  local target
  target=$(get_agent_target "$agent_name")

  if [[ -z "$target" ]]; then
    echo "Unknown agent: $agent_name"
    show_agents
    exit 1
  fi

  if ! check_target "$target"; then
    exit 1
  fi

  send_message "$target" "$message"
  log_send "$agent_name" "$message"
  printf "Sent to %s\n" "$agent_name"
}

main "$@"
