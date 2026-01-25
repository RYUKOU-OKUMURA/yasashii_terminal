#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/../.." && pwd)

log_info() { printf "[INFO] %s\n" "$1"; }
log_success() { printf "[OK] %s\n" "$1"; }

log_info "Cleaning existing tmux sessions (if any)..."

tmux kill-session -t multiagent 2>/dev/null || true
tmux kill-session -t president 2>/dev/null || true

mkdir -p "$SCRIPT_DIR/tmp" "$SCRIPT_DIR/logs"
rm -f "$SCRIPT_DIR/tmp"/worker*_done.txt 2>/dev/null || true

log_success "Cleanup done"

log_info "Loading tmux config (repo-local)..."
tmux source-file "$ROOT_DIR/.ai-team/tmux.conf" 2>/dev/null || true

log_info "Creating multiagent session (4 panes)..."

tmux new-session -d -s multiagent -n agents

# 2x2 grid
# Pane 0 (top-left)
# Pane 1 (top-right)
# Pane 2 (bottom-left)
# Pane 3 (bottom-right)

tmux split-window -h -t "multiagent:0"
tmux select-pane -t "multiagent:0.0"
tmux split-window -v
tmux select-pane -t "multiagent:0.2"
tmux split-window -v

PANE_TITLES=("boss1" "worker1" "worker2" "worker3")

for i in {0..3}; do
  tmux select-pane -t "multiagent:0.$i" -T "${PANE_TITLES[$i]}"
  tmux send-keys -t "multiagent:0.$i" "cd \"$ROOT_DIR\"" C-m
  tmux send-keys -t "multiagent:0.$i" "export PS1='(${PANE_TITLES[$i]}) \\w$ '" C-m
  tmux send-keys -t "multiagent:0.$i" "echo '=== ${PANE_TITLES[$i]} session ==='" C-m
  sleep 0.05
done

log_success "multiagent session ready"

log_info "Creating president session..."

tmux new-session -d -s president

tmux send-keys -t president "cd \"$ROOT_DIR\"" C-m

tmux send-keys -t president "export PS1='(PRESIDENT) \\w$ '" C-m

tmux send-keys -t president "echo '=== PRESIDENT session ==='" C-m

log_success "president session ready"

log_info "Sessions overview:"

tmux list-sessions

log_success "Setup complete"

cat <<'MSG'
Next steps:
  1) Launch agents:
     ./.ai-team/multiagent/launch-agents.sh
  2) Bootstrap role prompts:
     ./.ai-team/multiagent/bootstrap.sh
  3) Attach:
     tmux attach-session -t president
     tmux attach-session -t multiagent
MSG
