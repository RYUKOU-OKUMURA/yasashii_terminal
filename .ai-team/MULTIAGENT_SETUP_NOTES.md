# mulch_Editor マルチエージェント（tmux + Claude Code）セットアップまとめ

最終更新: 2026-01-24

このドキュメントは、`mulch_Editor` リポジトリに **tmux 上のマルチエージェント環境（PRESIDENT / boss1 / worker1-3）** を組み込むために実施した変更点と、運用手順をまとめたものです。

---

## 目的 / ゴール

- 1つのリポジトリ内で、`president`（単独セッション）と `multiagent`（4ペイン）を立ち上げる
- 各ペインで Claude Code を起動し、`tmux send-keys` で相互にメッセージを送れるようにする
- 「起動しただけで勝手に開発が走らない」ように、起動時は **挨拶と役割付与だけ** にする
- コマンドをコピペしやすい形で、手順書を整備する

---

## 重要な仕様（なぜ“自動で指示が飛ばない”のか）

この仕組みは **自動転送デーモン** ではありません。

- メッセージ送信は `./.ai-team/multiagent/agent-send.sh` が `tmux send-keys` で文字を打ち込む方式
- PRESIDENTが boss/worker に指示を出すには、PRESIDENT（AI）が **自分で** `agent-send.sh` を実行する必要があります
- そのため、PRESIDENTに「agent-send.sh を使って指示を送る」というルールを明示しないと、委譲が起きないことがあります

---

## 追加した構成（どこに何を置いたか）

マルチエージェントの運用品は `./.ai-team/multiagent/` に集約しています（リポジトリ直下を汚さないため）。

### 運用ドキュメント

- `./.ai-team/SETUP_GUIDE.md`  
  コピペしやすい実行手順（最短→分解→トラブル対応の順）
- `./.ai-team/MULTIAGENT_SETUP_NOTES.md`  
  このまとめ（変更点・背景・運用ルール）

### tmux / メッセージ送信スクリプト

- `./.ai-team/multiagent/setup.sh`  
  tmuxセッション作成（既存の `president` / `multiagent` があれば削除して作り直し）
- `./.ai-team/multiagent/launch-agents.sh`  
  各ペインに `claude --dangerously-skip-permissions` を送信して起動（`--yes` で確認スキップ可）
- `./.ai-team/multiagent/bootstrap.sh`  
  役割プロンプト投入（**挨拶 + 役割付与 + 待機**。勝手にタスク開始しない）
- `./.ai-team/multiagent/start.sh`  
  `setup.sh` → `launch-agents.sh` → `bootstrap.sh` をまとめて実行し、最後に tmux attach
- `./.ai-team/multiagent/agent-send.sh`  
  `president/boss1/worker1..3` 宛のメッセージ送信（tmuxターゲットに打ち込む）
- `./.ai-team/multiagent/project-status.sh`  
  セッション存在と「完了フラグ（doneファイル）」の簡易確認

#### tmuxターゲット対応表（内部仕様）

- `president` → `president`
- `boss1` → `multiagent:0.0`
- `worker1` → `multiagent:0.1`
- `worker2` → `multiagent:0.2`
- `worker3` → `multiagent:0.3`

### 役割指示書（プロンプト）

- `./.ai-team/multiagent/instructions/president.md`
- `./.ai-team/multiagent/instructions/boss.md`
- `./.ai-team/multiagent/instructions/worker.md`（共通）
- `./.ai-team/multiagent/instructions/worker1.md`（Renderer/UI）
- `./.ai-team/multiagent/instructions/worker2.md`（Main Process）
- `./.ai-team/multiagent/instructions/worker3.md`（Shared Types/QA）

共通のルール:
- **ユーザーから具体的な依頼が来るまでは、勝手に開発を開始しない**

### スキル（任意 / 役割の運用手順を固定化）

`./.ai-team/multiagent/skills/` に、役割別および共通の `SKILL.md` を置けます。

- 役割別:
  - `./.ai-team/multiagent/skills/role-president/SKILL.md`
  - `./.ai-team/multiagent/skills/role-boss1/SKILL.md`
  - `./.ai-team/multiagent/skills/role-worker1/SKILL.md`
  - `./.ai-team/multiagent/skills/role-worker2/SKILL.md`
  - `./.ai-team/multiagent/skills/role-worker3/SKILL.md`
- 共通（品質/安全/UXなど）:
  - `./.ai-team/multiagent/skills/ipc-contract-spec/SKILL.md`
  - `./.ai-team/multiagent/skills/electron-security-review/SKILL.md`
  - `./.ai-team/multiagent/skills/manual-test-plan/SKILL.md`
  - `./.ai-team/multiagent/skills/task-cards/SKILL.md`

---

## `.claude` の調整（Claude Codeでスクリプトが叩けるように）

- `./.claude/settings.local.json` を追加/更新し、Claude Code の権限許可に以下を含めています:
  - `./.ai-team/multiagent/start.sh`
  - `./.ai-team/multiagent/bootstrap.sh`
  - `./.ai-team/multiagent/agent-send.sh`
  - その他、最低限の `mkdir/touch/echo/chmod` など

※ `settings.local.json` はローカル環境専用の扱いにしています（通常はコミット不要）。

## 既存の `CLAUDE.md` / `.claude/agents` との住み分け

- `./CLAUDE.md` と `./.claude/agents/` は、このプロジェクト（やさしいターミナル）の「サブエージェント設計/ルーティング」用
- `./.ai-team/multiagent/` は、tmux上で別ペインのAIを立ち上げる「運用ツール」

両方あるのが正で、競合しないようにディレクトリを分けています。

---

## `.gitignore` の調整（コミットしたくないもの）

以下を無視する設定にしています:

- `./.ai-team/multiagent/tmp/`（完了フラグなどのランタイム）
- `./.ai-team/multiagent/logs/`（送信ログ）
- `./Claude-Code-Communication-main/`（元ネタ参照用のディレクトリ。運用上は不要）

---

## コマンド/オプション詳細（コピペ用）

### `start.sh`

まとめて起動:

```bash
./.ai-team/multiagent/start.sh
```

オプション:
- `--attach president|multiagent|none`（デフォルト `president`）
- `--no-bootstrap`（役割プロンプト投入をしない）
- `--bootstrap-delay <seconds>`（起動直後の投入を遅らせる。デフォルト `2`）
- `--cmd "<command>"`（各ペインで起動するコマンドを差し替え。デフォルトは `claude --dangerously-skip-permissions`）

例:

```bash
./.ai-team/multiagent/start.sh --attach multiagent
./.ai-team/multiagent/start.sh --no-bootstrap
./.ai-team/multiagent/start.sh --bootstrap-delay 5
```

### `launch-agents.sh`

確認なしで起動:

```bash
./.ai-team/multiagent/launch-agents.sh --yes
```

### `bootstrap.sh`

起動直後に各ペインがまだ不安定なとき:

```bash
./.ai-team/multiagent/bootstrap.sh --delay 5
```

### `agent-send.sh`

```bash
./.ai-team/multiagent/agent-send.sh --list
./.ai-team/multiagent/agent-send.sh boss1 "メッセージ本文"
```

注意:
- 送信前に対象ペインへ `Ctrl+C` を送ります（入力欄クリア目的）。実行中プロセスがあると中断する可能性があります。

### 完了フラグ/ログの保存場所

- 完了フラグ: `./.ai-team/multiagent/tmp/worker{1,2,3}_done.txt`
- 送信ログ: `./.ai-team/multiagent/logs/send_log.txt`

---

## 運用手順（推奨フロー）

手順は `./.ai-team/SETUP_GUIDE.md` に集約しています。ここでは要点のみ。

### 1) 最短（基本はこれ）

```bash
./.ai-team/multiagent/start.sh
```

動作:
1. tmuxセッションを作る
2. 各ペインで Claude Code を起動する
3. 役割プロンプトを投入する（※開始指示はしない）
4. `president` にアタッチする

### 2) 役割プロンプトを入れたくない / タイミングを後にしたい

```bash
./.ai-team/multiagent/start.sh --no-bootstrap
./.ai-team/multiagent/bootstrap.sh
```

### 3) boss/worker 側（4ペイン）を先に見たい

```bash
tmux attach-session -t multiagent
```

---

## 起動時に勝手に指示が飛ばないようにした対応（経緯）

当初の `bootstrap` で「boss1にタスク分解を送って開始」のような開始指示まで自動で入っていたため、
PRESIDENTを開いた瞬間に勝手に開発が走ることがありました。

現在は以下に統一しています:

- `bootstrap.sh` は **挨拶 + 役割付与 + 待機** のみ
- 指示書（`president.md / boss.md / worker.md`）にも「起動直後は待機」を明記
- 実際のプロジェクト開始は **ユーザーがPRESIDENTに依頼を入力した後** に行う

---

## 参考（元ネタの扱い）

`./Claude-Code-Communication-main/` は、元記事/元リポジトリの参照用に残してあるだけです。
このリポジトリの運用は `./.ai-team/multiagent/` 側で完結します。
