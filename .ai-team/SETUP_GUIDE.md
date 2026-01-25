# マルチエージェント起動ガイド（tmux + Claude Code）

## 最短スタート
```bash
./.ai-team/multiagent/start.sh
```

- `president` セッションに自動でアタッチします
- 起動直後は **誰にも自動送信しません**（起動のみ）
- PRESIDENT へのメッセージはユーザーが手動で入力します

## よく使うオプション
```bash
# boss/worker側を先に見る
./.ai-team/multiagent/start.sh --attach multiagent

# 役割プロンプトを手動で投入する
./.ai-team/multiagent/bootstrap.sh

# president画面だけ開きたい
tmux attach-session -t president

# 起動直後に役割プロンプトを投入する（必要なときだけ）
./.ai-team/multiagent/start.sh --bootstrap
./.ai-team/multiagent/start.sh --bootstrap --bootstrap-delay 5

# 起動コマンドを差し替える
./.ai-team/multiagent/start.sh --cmd "claude --dangerously-skip-permissions"
```

## 主要スクリプト
- `./.ai-team/multiagent/setup.sh` : tmux セッションを作成
- `./.ai-team/multiagent/launch-agents.sh` : 各ペインで Claude Code を起動
- `./.ai-team/multiagent/bootstrap.sh` : 役割プロンプト投入（boss/workerのみ）
- `./.ai-team/multiagent/agent-send.sh` : メッセージ送信
- `./.ai-team/multiagent/project-status.sh` : 簡易ステータス

## 送信例
```bash
./.ai-team/multiagent/agent-send.sh boss1 "あなたはboss1です。タスクを分解してください。"
```

## 完了フラグ
作業完了時に以下を作成します（任意）:
- `./.ai-team/multiagent/tmp/worker1_done.txt`
- `./.ai-team/multiagent/tmp/worker2_done.txt`
- `./.ai-team/multiagent/tmp/worker3_done.txt`

## 参照
- `./CLAUDE.md`（プロジェクト全体の方針）
- `./.ai-team/multiagent/instructions/`（役割指示書）
- `./.ai-team/tmux.conf`（tmuxのローカル設定）
