---
name: manual-test-plan
description: >
  実装完了の確認に必要な最小の手動テスト手順（回帰込み）を作るスキル。
---

# manual-test-plan

## When to Use
- UI/操作体系に触る
- 実行/永続化/履歴に触る
- IPC/型契約が変わる

## Output（最小）
```text
【手動テスト】<feature名>

前提:
- OS: macOS
- 期待: Enter=改行 / Cmd+Enter=送信（など）

手順:
1) ...
2) ...

期待結果:
- ...

回帰確認（最低1本）:
- ...
```

