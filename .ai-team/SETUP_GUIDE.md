# セットアップガイド（mulch_Editor / やさしいターミナル）

このリポジトリで **tmux + 複数AI CLI**（Claude Code / Codex など）を「社長 + チーム」で同時稼働させるためのセットアップです。

## 前提

- macOS / Linux
- `tmux` が使えること
- 各ペインで起動するAI CLIコマンドが使えること（例：`claude` / `codex`）

## セットアップ（tmuxセッション作成）

```bash
./.ai-team/multiagent/setup.sh
```

作られるセッション:
- `president`（1ペイン）
- `multiagent`（4ペイン: `boss1`, `worker1`, `worker2`, `worker3`）

## エージェント起動（各ペインでCLI起動）

デフォルトは `claude --dangerously-skip-permissions` を送ります。

```bash
./.ai-team/multiagent/launch-agents.sh
```

別のCLIを使う場合（例）:

```bash
AGENT_CMD='codex' ./.ai-team/multiagent/launch-agents.sh
```

## 1コマンドで「作成→起動→アタッチ」（ブログ記事っぽくしたい場合）

※ “ログイン済み状態” はCLI側の認証が必要なので **初回だけ** 各ペインでブラウザ認証が発生することがあります（自動ログインはできません）。  
ただし、一度認証すると次回以降は認証なしで起動できるケースが多いので、tmuxセッションを落とさず使うのが近道です。

```bash
./.ai-team/multiagent/start.sh
```

Codexで起動したい例:

```bash
./.ai-team/multiagent/start.sh --cmd "codex"
```

multiagent（4ペイン）にそのまま入る例:

```bash
./.ai-team/multiagent/start.sh --attach multiagent
```

## 画面を開く

```bash
tmux attach-session -t president
tmux attach-session -t multiagent
```

## メッセージ送信（任意）

```bash
./.ai-team/multiagent/agent-send.sh --list
./.ai-team/multiagent/agent-send.sh boss1 "要件を分解してworkerへ割り当てて"
```

## 進捗確認（任意）

```bash
./.ai-team/multiagent/project-status.sh
```
