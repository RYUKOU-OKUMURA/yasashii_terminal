#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$SCRIPT_DIR/tmp"

echo "=================================="
echo "mulch_Editor - Multi-Agent Status"
echo "現在時刻: $(date +%Y/%m/%d' '%H:%M:%S)"
echo "=================================="

echo -e "\n【tmuxセッション】"
if tmux has-session -t president 2>/dev/null; then
  echo "president: ✅"
else
  echo "president: ❌"
fi

if tmux has-session -t multiagent 2>/dev/null; then
  echo "multiagent: ✅"
else
  echo "multiagent: ❌"
fi

echo -e "\n【チーム進捗状況】"
if [ -f "$TMP_DIR/worker1_done.txt" ]; then
  echo "Worker1 (renderer/UI): ✅ 完了"
else
  echo "Worker1 (renderer/UI): 🔄 作業中"
fi

if [ -f "$TMP_DIR/worker2_done.txt" ]; then
  echo "Worker2 (main process): ✅ 完了"
else
  echo "Worker2 (main process): 🔄 作業中"
fi

if [ -f "$TMP_DIR/worker3_done.txt" ]; then
  echo "Worker3 (shared types / QA): ✅ 完了"
else
  echo "Worker3 (shared types / QA): 🔄 作業中"
fi

echo -e "\n=================================="

