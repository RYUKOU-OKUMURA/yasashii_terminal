#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"

get_agent_target() {
  case "$1" in
    "president") echo "president" ;;
    "boss1") echo "multiagent:0.0" ;;
    "worker1") echo "multiagent:0.1" ;;
    "worker2") echo "multiagent:0.2" ;;
    "worker3") echo "multiagent:0.3" ;;
    *) echo "" ;;
  esac
}

show_usage() {
  cat << EOF
🤖 Agent間メッセージ送信

使用方法:
  $0 [エージェント名] [メッセージ]
  $0 --list

利用可能エージェント:
  president - プロジェクト統括責任者
  boss1     - 開発コーディネーター
  worker1   - Renderer/UI
  worker2   - Main Process
  worker3   - Shared Types / QA

使用例:
  $0 president "指示書に従って"
  $0 boss1 "要件分解してworkerに割り当てて"
EOF
}

show_agents() {
  echo "📋 利用可能なエージェント:"
  echo "=========================="
  echo "  president → president:0     (統括責任者)"
  echo "  boss1     → multiagent:0.0  (開発コーディネーター)"
  echo "  worker1   → multiagent:0.1  (Renderer/UI)"
  echo "  worker2   → multiagent:0.2  (Main Process)"
  echo "  worker3   → multiagent:0.3  (Shared Types / QA)"
}

log_send() {
  local agent="$1"
  local message="$2"
  local timestamp
  timestamp="$(date '+%Y-%m-%d %H:%M:%S')"

  mkdir -p "$LOG_DIR"
  echo "[$timestamp] $agent: SENT - \"$message\"" >> "$LOG_DIR/send_log.txt"
}

send_message() {
  local target="$1"
  local message="$2"

  echo "📤 送信中: $target ← '$message'"

  tmux send-keys -t "$target" C-c
  sleep 0.2

  tmux send-keys -t "$target" "$message"
  sleep 0.1

  tmux send-keys -t "$target" C-m
  sleep 0.2
}

check_target() {
  local target="$1"
  local session_name="${target%%:*}"

  if ! tmux has-session -t "$session_name" 2>/dev/null; then
    echo "❌ セッション '$session_name' が見つかりません"
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
  target="$(get_agent_target "$agent_name")"

  if [[ -z "$target" ]]; then
    echo "❌ エラー: 不明なエージェント '$agent_name'"
    echo "利用可能エージェント: $0 --list"
    exit 1
  fi

  if ! check_target "$target"; then
    exit 1
  fi

  send_message "$target" "$message"
  log_send "$agent_name" "$message"

  echo "✅ 送信完了: $agent_name に '$message'"
}

main "$@"

