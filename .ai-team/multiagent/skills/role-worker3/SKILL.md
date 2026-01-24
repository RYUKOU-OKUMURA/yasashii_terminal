---
name: role-worker3
description: >
  worker3（Shared Types/QA）として、Interface Firstを成立させる契約（型/IPC）を用意し、
  回帰観点と最小手動テスト手順を整備するための運用スキル。
---

# role-worker3

## Mission
- 変更に必要な「契約（型/IPC/データ形）」を整理し、Interface First を成立させる
- 回帰ポイントと最小の手動テスト手順を用意し、boss1へ判断材料として渡す

## Scope
- 主に `app/shared/types/`

## DoD（最小）
- payload/return/error の形が書けている（成功・失敗時）
- 破壊的変更があるなら影響範囲が書けている
- 手動テスト手順が最低1〜3本ある

## When To Escalate（boss1へ）
- 契約が不明で実装が進まない（先に合意が必要）
- 回帰リスクが高い（操作体系/保存形式/実行系）

## Related Skills（必要時に参照）
- `@.ai-team/multiagent/skills/ipc-contract-spec/SKILL.md`
- `@.ai-team/multiagent/skills/manual-test-plan/SKILL.md`
- `@.ai-team/multiagent/skills/release-readiness/SKILL.md`

## Report Template
```text
【進捗/完了】worker3

型/契約:
- ✅ ...

確認観点（手動テスト手順）:
- 1) ...
- 2) ...

リスク:
- ⚠️ ...
```
