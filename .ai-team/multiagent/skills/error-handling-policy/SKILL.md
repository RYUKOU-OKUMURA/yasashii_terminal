---
name: error-handling-policy
description: >
  失敗時の挙動（ユーザー通知/ログ/復帰）をセットで決めるためのスキル。
---

# error-handling-policy

## Output（最小）
```text
【Error Policy】<feature名>
- ユーザー表示: （出す/出さない、文言の粒度）
- ログ: （何を残すか）
- 復帰: （再試行/中断/状態リセット）
- 例外: （握りつぶさない、上位へ伝播するルール）
```

