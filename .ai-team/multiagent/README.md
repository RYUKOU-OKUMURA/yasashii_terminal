# tmux マルチエージェント（mulch_Editor用）

このフォルダは、`president` / `boss1` / `worker1..3` を **tmux上の別ペイン/別セッション**で起動し、`tmux send-keys` で相互にメッセージを送るためのツール一式です。

## 入口

- セッション作成: `./setup.sh`
- CLI一括起動: `./launch-agents.sh`
- まとめて実行: `./start.sh`
- 役割プロンプト送信: `./bootstrap.sh`
- メッセージ送信: `./agent-send.sh`
- 進捗表示: `./project-status.sh`
- 役割指示書: `./instructions/`
