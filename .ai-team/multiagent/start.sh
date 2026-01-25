#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

show_usage() {
  cat <<'MSG'
Usage:
  ./.ai-team/multiagent/start.sh [options]

Options:
  --attach president|multiagent|none   Attach target (default: president)
  --bootstrap                          Send role prompts after launch (default: off)
  --bootstrap-delay <seconds>          Delay before bootstrap (default: 2)
  --cmd "<command>"                    Command to run in each pane (default: claude --dangerously-skip-permissions)
  -h, --help                           Show this help
MSG
}

attach_target="president"
run_bootstrap=false
bootstrap_delay=2
cmd="claude --dangerously-skip-permissions"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --attach)
      attach_target="$2"
      shift 2
      ;;
    --bootstrap)
      run_bootstrap=true
      shift
      ;;
    --no-bootstrap)
      run_bootstrap=false
      shift
      ;;
    --bootstrap-delay)
      bootstrap_delay="$2"
      shift 2
      ;;
    --cmd)
      cmd="$2"
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

case "$attach_target" in
  president|multiagent|none) ;;
  *)
    echo "Invalid --attach value: $attach_target"
    exit 1
    ;;
esac

"$SCRIPT_DIR/setup.sh"
"$SCRIPT_DIR/launch-agents.sh" --yes --cmd "$cmd"

if [ "$run_bootstrap" = true ]; then
  "$SCRIPT_DIR/bootstrap.sh" --delay "$bootstrap_delay"
fi

case "$attach_target" in
  president)
    tmux attach-session -t president
    ;;
  multiagent)
    tmux attach-session -t multiagent
    ;;
  none)
    ;;
esac
