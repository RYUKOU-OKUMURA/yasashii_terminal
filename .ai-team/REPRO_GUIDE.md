# マルチエージェント運用（再現手順メモ）

このドキュメントは、他リポジトリでも今回の運用を再現するための最短手順です。
参考: `Claude-Code-Communication-main` と解説記事（Qiita）
https://qiita.com/akira_papa_AI/items/9f6c6605e925a88b9ac5


## 目的
- tmuxで `president` + `multiagent(2x2)` を立ち上げる
- **起動直後は何も送信しない**（起動のみ）
- 指示/役割プロンプトは必要時に**手動**で送る

---

## 1. ディレクトリ構成をコピー
新しいリポジトリのルート直下に、以下を作る/コピーします。

```
.ai-team/
  SETUP_GUIDE.md
  MULTIAGENT_SETUP_NOTES.md
  REPRO_GUIDE.md
  tmux.conf
  multiagent/
    start.sh
    setup.sh
    launch-agents.sh
    bootstrap.sh
    agent-send.sh
    project-status.sh
    instructions/
      president.md
      boss.md
      worker.md
      worker1.md
      worker2.md
      worker3.md
```

※ 既存リポに合わせて文言/役割は調整してOK。

---

## 2. スクリプトを実行可能にする
```
chmod +x .ai-team/multiagent/*.sh
```

---

## 3. tmux 設定（マウス/ダブルクリック整列）
`.ai-team/tmux.conf` を作成:
```
set -g mouse on
bind -n DoubleClick1Pane select-layout tiled
```

`setup.sh` で読み込むようにする:
```
tmux source-file "$ROOT_DIR/.ai-team/tmux.conf" 2>/dev/null || true
```

---

## 4. 起動は「起動のみ」にする
`start.sh` は以下が**デフォルト**になっていること:
- `run_bootstrap=false`
- `--bootstrap` を付けたときだけ役割プロンプト送信

これにより「起動直後は誰にも送信しない」仕様になります。

---

## 5. bootstrap は boss/worker のみに送る
`bootstrap.sh` の送信対象は以下にする:
- boss1, worker1-3 のみ
- president には送らない

---

## 6. .claude 設定（ローカル権限）
`.claude/settings.local.json` を用意:
```
{
  "permissions": {
    "allow": [
      "Bash(./.ai-team/multiagent/start.sh:*)",
      "Bash(./.ai-team/multiagent/setup.sh:*)",
      "Bash(./.ai-team/multiagent/launch-agents.sh:*)",
      "Bash(./.ai-team/multiagent/bootstrap.sh:*)",
      "Bash(./.ai-team/multiagent/agent-send.sh:*)",
      "Bash(./.ai-team/multiagent/project-status.sh:*)",
      "Bash(mkdir:*)",
      "Bash(touch:*)",
      "Bash(echo:*)",
      "Bash(chmod:*)",
      "Bash(date:*)"
    ],
    "deny": []
  }
}
```
※ ローカル運用のみ（コミット不要）。

---

## 7. .gitignore に追加
```
.ai-team/multiagent/tmp/
.ai-team/multiagent/logs/
.claude/settings.local.json
```

---

## 8. 使い方（最短）
```
./.ai-team/multiagent/start.sh
```

- **起動のみ**（自動送信なし）
- PRESIDENT への指示はユーザーが手動で入力

役割プロンプトを入れたいときだけ:
```
./.ai-team/multiagent/bootstrap.sh
```

---

## 9. 参照元
- `Claude-Code-Communication-main/`（原型）
- 解説記事（Qiita）

