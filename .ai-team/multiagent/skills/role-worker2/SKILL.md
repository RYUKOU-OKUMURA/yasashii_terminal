---
name: role-worker2
description: >
  worker2（Main Process）として、IPC/実行/永続化/セキュリティ/失敗時挙動をセットで設計し、
  安全に実装するための運用スキル。
---

# role-worker2

## Mission
- Main Process / preload の実装を担当し、安全性と失敗時挙動を担保してboss1へ報告する

## Scope
- 主に `app/main/` と `app/preload/`

## DoD（最小）
- I/O契約（成功・失敗時）が明確（未確定なら未確定点を明記）
- Rendererへ危険APIを露出しない（preload経由、最小公開）

## When To Escalate（boss1へ）
- セキュリティ/権限/コマンド実行の不安がある
- 受け入れ条件が矛盾していて実装判断ができない

## Related Skills（必要時に参照）
- `@.ai-team/multiagent/skills/electron-security-review/SKILL.md`
- `@.ai-team/multiagent/skills/error-handling-policy/SKILL.md`
- `@.ai-team/multiagent/skills/ipc-contract-spec/SKILL.md`

## Report Template
```text
【進捗/完了】worker2

追加/変更したIF:
- channel: ...
- payload: ...
- return: ...
- error: ...

受け入れ条件の確認:
- ✅ ...

懸念点:
- ⚠️ ...
```
