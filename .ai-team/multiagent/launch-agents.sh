#!/usr/bin/env bash

set -euo pipefail

log_info() { echo -e "\033[1;32m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[1;34m[SUCCESS]\033[0m $1"; }
log_warning() { echo -e "\033[1;33m[WARNING]\033[0m $1"; }

AGENT_CMD_DEFAULT="claude --dangerously-skip-permissions"
AGENT_CMD="${AGENT_CMD:-$AGENT_CMD_DEFAULT}"
AUTO_YES=false

usage() {
  cat << EOF
Usage:
  $0 [--yes] [--cmd "<command>"]

Options:
  --yes         Skip confirmation prompt
  --cmd         Command to run in each pane (overrides AGENT_CMD env)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)
      AUTO_YES=true
      shift
      ;;
    --cmd)
      if [[ $# -lt 2 ]]; then
        echo "❌ --cmd requires an argument"
        exit 2
      fi
      AGENT_CMD="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "❌ Unknown arg: $1"
      usage
      exit 2
      ;;
  esac
done

echo "🤖 AIエージェント一括起動"
echo "=========================="
echo ""
echo "Command: $AGENT_CMD"
echo ""

check_sessions() {
  local all_exist=true

  if ! tmux has-session -t president 2>/dev/null; then
    log_warning "presidentセッションが存在しません"
    all_exist=false
  fi

  if ! tmux has-session -t multiagent 2>/dev/null; then
    log_warning "multiagentセッションが存在しません"
    all_exist=false
  fi

  if [ "$all_exist" = false ]; then
    echo ""
    echo "❌ 必要なセッションが見つかりません"
    echo "   先に ./.ai-team/multiagent/setup.sh を実行してください"
    exit 1
  fi
}

launch_agent() {
  local target=$1
  local name=$2

  log_info "$name を起動中..."
  tmux send-keys -t "$target" "$AGENT_CMD" C-m
  sleep 0.5
}

main() {
  check_sessions

  echo "📋 起動するエージェント:"
  echo "  - PRESIDENT (統括責任者)"
  echo "  - boss1 (開発コーディネーター)"
  echo "  - worker1 (renderer/UI)"
  echo "  - worker2 (main process)"
  echo "  - worker3 (shared types / QA)"
  echo ""

  if [[ "$AUTO_YES" = false ]]; then
    read -r -p "全エージェントを起動しますか？ (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      echo "キャンセルしました"
      exit 0
    fi
  fi

  echo ""
  log_info "起動を開始します..."
  echo ""

  launch_agent "president" "PRESIDENT"
  launch_agent "multiagent:0.0" "boss1"
  launch_agent "multiagent:0.1" "worker1"
  launch_agent "multiagent:0.2" "worker2"
  launch_agent "multiagent:0.3" "worker3"

  echo ""
  log_success "✅ 全エージェントの起動コマンドを送信しました"
  echo ""
  echo "📋 次のステップ:"
  echo "  1) 各画面で認証が必要なら完了してください"
  echo "  2) PRESIDENTに指示を入力（例）:"
  echo "     「あなたはpresidentです。要件定義_完成版.md を前提に、MVPの実装計画を作って」"
}

main "$@"
