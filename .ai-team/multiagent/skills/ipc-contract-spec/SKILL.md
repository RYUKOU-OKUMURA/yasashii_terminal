---
name: ipc-contract-spec
description: >
  Interface First（契約→実装）を成立させるために、IPC/型契約（payload/return/error）と
  失敗時挙動を最小フォーマットで固めるスキル。
---

# ipc-contract-spec

## When to Use
- Main/Rendererにまたがる変更
- データ形やIPCチャンネルが増減する変更
- 失敗時の挙動が曖昧で実装が止まりそうなとき

## Output（契約メモの最小）
```text
【契約】<feature名>

IPC:
- channel: ...
- payload: ...
- return: ...
- error: ...（例: { code, message }）

失敗時挙動:
- ユーザー表示: ...
- ログ: ...
- リトライ/復帰: ...

互換性/破壊的変更:
- 影響範囲: ...
```

## Guardrails
- 「成功時」だけでなく「失敗時」を必ず書く
- 型は `app/shared/types/` に置く（実装より先に確定）

