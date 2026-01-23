#!/usr/bin/env bash

set -euo pipefail

log_info() { echo -e "\033[1;32m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[1;34m[SUCCESS]\033[0m $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/../.." && pwd))"
TMP_DIR="$SCRIPT_DIR/tmp"

echo "🤖 Multi-Agent tmux 環境構築（mulch_Editor）"
echo "============================================"
echo ""

log_info "🧹 既存セッションクリーンアップ開始..."
tmux kill-session -t multiagent 2>/dev/null && log_info "multiagentセッション削除完了" || log_info "multiagentセッションは存在しませんでした"
tmux kill-session -t president 2>/dev/null && log_info "presidentセッション削除完了" || log_info "presidentセッションは存在しませんでした"

mkdir -p "$TMP_DIR"
rm -f "$TMP_DIR"/worker*_done.txt 2>/dev/null || true

log_success "✅ クリーンアップ完了"
echo ""

log_info "📺 multiagentセッション作成開始 (4ペイン)..."
tmux new-session -d -s multiagent -n "agents"

tmux split-window -h -t "multiagent:0"
tmux select-pane -t "multiagent:0.0"
tmux split-window -v
tmux select-pane -t "multiagent:0.2"
tmux split-window -v

PANE_TITLES=("boss1" "worker1" "worker2" "worker3")

for i in {0..3}; do
  tmux select-pane -t "multiagent:0.$i" -T "${PANE_TITLES[$i]}"

  tmux send-keys -t "multiagent:0.$i" "cd \"$REPO_ROOT\"" C-m

  if [ "$i" -eq 0 ]; then
    tmux send-keys -t "multiagent:0.$i" "export PS1='(\[\033[1;31m\]${PANE_TITLES[$i]}\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
  else
    tmux send-keys -t "multiagent:0.$i" "export PS1='(\[\033[1;34m\]${PANE_TITLES[$i]}\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
  fi

  tmux send-keys -t "multiagent:0.$i" "echo '=== ${PANE_TITLES[$i]} ==='" C-m
  tmux send-keys -t "multiagent:0.$i" "echo 'Instructions: $SCRIPT_DIR/instructions'" C-m
done

log_success "✅ multiagentセッション作成完了"
echo ""

log_info "👑 presidentセッション作成開始..."
tmux new-session -d -s president -n "president"
tmux send-keys -t president "cd \"$REPO_ROOT\"" C-m
tmux send-keys -t president "export PS1='(\[\033[1;35m\]PRESIDENT\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
tmux send-keys -t president "echo '=== PRESIDENT ==='" C-m
tmux send-keys -t president "echo 'Instructions: $SCRIPT_DIR/instructions'" C-m

log_success "✅ presidentセッション作成完了"
echo ""

log_info "🔍 セッション確認中..."
tmux list-sessions
echo ""

log_success "🎉 セットアップ完了！"
echo ""
echo "📋 次のステップ:"
echo "  1) tmux attach-session -t president"
echo "  2) tmux attach-session -t multiagent"
echo "  3) ./.ai-team/multiagent/launch-agents.sh"

