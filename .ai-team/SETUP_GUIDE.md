# セットアップガイド（mulch_Editor / やさしいターミナル）

このリポジトリで **tmux + Claude Code** を「PRESIDENT + チーム（boss1/worker1-3）」として同時稼働させる手順です。

## 0. 前提（ここだけ先に確認）

- macOS / Linux
- `tmux` が使える（`tmux -V`）
- Claude Code CLI が使える（`claude` が実行できる）

---

## 1. 最短（コピペ用）

### ① 起動（作成→起動→役割投入→PRESIDENTに入る）

```bash
./.ai-team/multiagent/start.sh
```

起動後は、**PRESIDENTは待機**します（ユーザーがPRESIDENTへ指示を出すまで、勝手にboss/workerへ作業指示を飛ばしません）。

PRESIDENTに入力する例:

```text
あなたはpresidentです。
要件定義_完成版.md を前提に、次の機能を実装してください: （ここに依頼内容）
```

### ② 4ペイン（boss/worker）側に入る（必要なら）

```bash
tmux attach-session -t multiagent
```

### ③ PRESIDENT側に入る（戻りたいとき）

```bash
tmux attach-session -t president
```

### ④ 手動で疎通確認（任意）

```bash
./.ai-team/multiagent/agent-send.sh boss1 "ping"
```

### ⑤ 進捗確認（任意）

```bash
./.ai-team/multiagent/project-status.sh
```

---

## 2. 分解実行（必要なときだけ）

「全部まとめて」ではなく、段階ごとに叩きたい場合のコピペです。

### ① tmuxセッション作成 → ② 全ペイン起動 → ③ 役割プロンプト投入

```bash
./.ai-team/multiagent/setup.sh
./.ai-team/multiagent/launch-agents.sh --yes
./.ai-team/multiagent/bootstrap.sh
```

---

## 3. よく使うコマンド（コピペ用）

### エージェント一覧
```bash
./.ai-team/multiagent/agent-send.sh --list
```

### ボスに指示を送る（例）
```bash
./.ai-team/multiagent/agent-send.sh boss1 "要件定義_完成版.md を前提にタスク分解してworkerへ割り当てて"
```

### 全部リセット（tmuxセッションを作り直す）
```bash
./.ai-team/multiagent/setup.sh
```

---

## 4. もし動かないとき（後回しでOK）

### A) セッションが無い / 変な状態
```bash
tmux ls
./.ai-team/multiagent/setup.sh
```

### B) メッセージが届かない（tmuxターゲットの問題）
```bash
./.ai-team/multiagent/agent-send.sh boss1 "ping"
```

### C) “自動で指示が飛ばない”（PRESIDENTが委譲しない）
PRESIDENTに以下を貼ってください:

```text
あなたはpresidentです。@.ai-team/multiagent/instructions/president.md に従ってください。
boss1/workerへは必ず ./.ai-team/multiagent/agent-send.sh を使って指示を送ってください。
```
