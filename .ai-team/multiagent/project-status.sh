#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

printf "==================================\n"
printf "Multiagent status\n"
printf "Time: %s\n" "$(date '+%Y/%m/%d %H:%M:%S')"
printf "==================================\n"

printf "\n[Session]\n"
if tmux has-session -t president 2>/dev/null; then
  printf "president: OK\n"
else
  printf "president: missing\n"
fi
if tmux has-session -t multiagent 2>/dev/null; then
  printf "multiagent: OK\n"
else
  printf "multiagent: missing\n"
fi

printf "\n[Workers]\n"
if [ -f "$SCRIPT_DIR/tmp/worker1_done.txt" ]; then
  printf "worker1: done\n"
else
  printf "worker1: in progress\n"
fi

if [ -f "$SCRIPT_DIR/tmp/worker2_done.txt" ]; then
  printf "worker2: done\n"
else
  printf "worker2: in progress\n"
fi

if [ -f "$SCRIPT_DIR/tmp/worker3_done.txt" ]; then
  printf "worker3: done\n"
else
  printf "worker3: in progress\n"
fi

printf "\n==================================\n"
