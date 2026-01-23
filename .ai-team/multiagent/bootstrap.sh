#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTRUCTIONS_DIR="$SCRIPT_DIR/instructions"

DELAY_SEC=0

usage() {
  cat << EOF
Usage:
  $0 [--delay <seconds>]

Notes:
  - 各ペインでAI CLIが起動してから実行するのが確実です。
  - 起動直後に自動実行する場合は --delay を使ってください。
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --delay)
      if [[ $# -lt 2 ]]; then
        echo "❌ --delay requires an argument"
        exit 2
      fi
      DELAY_SEC="$2"
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

check_sessions() {
  if ! tmux has-session -t president 2>/dev/null; then
    echo "❌ president セッションがありません（先に setup.sh を実行してください）"
    exit 1
  fi
  if ! tmux has-session -t multiagent 2>/dev/null; then
    echo "❌ multiagent セッションがありません（先に setup.sh を実行してください）"
    exit 1
  fi
}

send() {
  local target="$1"
  local message="$2"

  echo "📨 bootstrap: $target"
  tmux send-keys -t "$target" "$message"
  tmux send-keys -t "$target" C-m
}

check_sessions

if [[ "$DELAY_SEC" != "0" ]]; then
  sleep "$DELAY_SEC"
fi

send "president" "こんにちは。あなたはpresidentです。@${INSTRUCTIONS_DIR}/president.md に従ってください。boss1/workerへは必要なときだけ、必ず ./.ai-team/multiagent/agent-send.sh を使って指示を送ってください。重要: ユーザーから具体的な依頼が来るまでは、boss1/workerへ勝手に作業指示を送らず待機してください（通信確認の挨拶程度はOK）。"

send "multiagent:0.0" "こんにちは。あなたはboss1です。@${INSTRUCTIONS_DIR}/boss.md に従ってください。重要: ユーザーからの具体的な依頼がpresident経由で来るまでは、勝手に開発を開始せず待機してください（通信確認の返答のみOK）。"

send "multiagent:0.1" "こんにちは。あなたはworker1です（Renderer/UI担当）。@${INSTRUCTIONS_DIR}/worker.md に従ってください。重要: boss1から具体的な指示が来るまでは待機してください（通信確認の返答のみOK）。"
send "multiagent:0.2" "こんにちは。あなたはworker2です（Main Process担当）。@${INSTRUCTIONS_DIR}/worker.md に従ってください。重要: boss1から具体的な指示が来るまでは待機してください（通信確認の返答のみOK）。"
send "multiagent:0.3" "こんにちは。あなたはworker3です（Shared Types/QA担当）。@${INSTRUCTIONS_DIR}/worker.md に従ってください。重要: boss1から具体的な指示が来るまでは待機してください（通信確認の返答のみOK）。"

echo "✅ bootstrap 完了"
