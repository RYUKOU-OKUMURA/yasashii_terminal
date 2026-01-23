#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat << EOF
Usage:
  $0 [--cmd "<command>"] [--attach president|multiagent|none]

Examples:
  $0
  $0 --cmd "codex"
  $0 --attach multiagent
EOF
}

AGENT_CMD="${AGENT_CMD:-claude --dangerously-skip-permissions}"
ATTACH="president"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cmd)
      if [[ $# -lt 2 ]]; then
        echo "❌ --cmd requires an argument"
        exit 2
      fi
      AGENT_CMD="$2"
      shift 2
      ;;
    --attach)
      if [[ $# -lt 2 ]]; then
        echo "❌ --attach requires an argument"
        exit 2
      fi
      ATTACH="$2"
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

"$SCRIPT_DIR/setup.sh"

AGENT_CMD="$AGENT_CMD" "$SCRIPT_DIR/launch-agents.sh" --yes

case "$ATTACH" in
  president)
    exec tmux attach-session -t president
    ;;
  multiagent)
    exec tmux attach-session -t multiagent
    ;;
  none)
    echo "✅ Started. Attach with:"
    echo "  tmux attach-session -t president"
    echo "  tmux attach-session -t multiagent"
    ;;
  *)
    echo "❌ Unknown attach target: $ATTACH"
    exit 2
    ;;
esac

