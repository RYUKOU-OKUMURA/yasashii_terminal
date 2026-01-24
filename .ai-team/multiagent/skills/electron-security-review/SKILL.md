---
name: electron-security-review
description: >
  Electron（Main/Preload/IPC/コマンド実行）周りの安全性を最低限チェックするスキル。
---

# electron-security-review

## When to Use
- IPCチャンネル追加/変更
- 外部URLを開く・ファイルを開く・コマンドを実行する変更
- preloadに新しいAPIを公開する変更

## Checklist（最低限）
- `contextIsolation: true` / `nodeIntegration: false` の前提を崩していない
- preload経由で最小APIのみ公開（Rendererに危険APIを渡さない）
- IPC入力（payload）を検証してから処理する
- ユーザー入力をそのままコマンドに渡さない（サニタイズ/許可リスト/制限）
- 外部URLは未検証のまま開かない

## Output（レビュー結果）
```text
【Security Review】
- 変更点: ...
- リスク: ...
- 対策: ...
- 残課題（あれば）: ...
```

