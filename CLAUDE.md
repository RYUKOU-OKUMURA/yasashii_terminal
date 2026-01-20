# やさしいターミナル - CLAUDE.md

このファイルはClaude Codeがプロジェクトを理解し、適切に開発を進めるためのルートエージェント定義です。

## プロジェクト概要

「やさしいターミナル」は、AI CLI（Claude Code / Codex / Gemini CLI）を日本語で直感的に操作できるElectronベースのデスクトップアプリケーションです。

### 目的
- **Enterは常に改行**できる複数行エディタを提供
- **送信は別操作**（Cmd+Enter / Ctrl+Enter）で実行し、誤送信を防ぐ
- 日本語コマンドで操作でき、AI CLIを直感的に使える

### ターゲットユーザー
- 非エンジニア（AIへの指示作成が中心）
- エンジニア（AI CLIの複数行入力を高速化したい）

### 非目的（スコープ外）
- AIモデルや課金・認証の実装（既存CLIに委譲）
- フルIDE（LSP/デバッガ/プロジェクト管理）
- OSやシェルの完全代替

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| 基盤 | Electron, TypeScript, React, Vite |
| エディタ | Monaco Editor |
| ターミナル出力 | xterm.js, @xterm/addon-fit |
| 状態管理 | Zustand |
| CLI実行 | node-pty, execa / child_process |
| 永続化 | electron-store, SQLite or JSONL |
| 開発ツール | Biome (Lint/Format), Vitest, Playwright |
| ビルド | electron-builder |

---

## ディレクトリ構成

```
yasashii_terminal/
├── CLAUDE.md                    # このファイル（ルートエージェント）
├── .claude/                     # Claude設定・サブエージェント定義
│   └── agents/
│       ├── dev-coordinator.md       # 開発コーディネーター（タスク振り分け・進捗管理）
│       ├── main-process-developer.md # Mainプロセス開発担当
│       ├── renderer-ui-reviewer.md   # Renderer/UIレビュー担当
│       └── shared-types-guardian.md  # 共有型定義担当
├── app/
│   ├── main/                    # Electronメインプロセス
│   │   ├── main.ts
│   │   ├── ipc-handlers.ts
│   │   ├── runner/
│   │   │   ├── ai-runner.ts
│   │   │   └── shell-runner.ts
│   │   ├── command-parser/
│   │   │   ├── index.ts
│   │   │   ├── alias-resolver.ts
│   │   │   ├── pattern-matcher.ts
│   │   │   └── presets/
│   │   │       └── ja-commands.json
│   │   └── stores/
│   │       ├── settings-store.ts
│   │       └── history-store.ts
│   ├── preload/
│   │   └── preload.ts
│   ├── renderer/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── Editor/
│   │   │   ├── Output/
│   │   │   ├── CommandBar/
│   │   │   └── Settings/
│   │   ├── stores/
│   │   └── styles/
│   └── shared/
│       └── types/
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── biome.json
```

---

## サブエージェントへのルーティング

タスクの内容に応じて、適切なサブエージェントを参照してください。

### 開発コーディネーター
複数のエージェントが関わる複雑なタスクや、プロジェクト全体の進捗管理が必要な場合は、まず開発コーディネーターに相談してください。

| タスク内容 | 参照するサブエージェント |
|-----------|------------------------|
| 複数プロセスにまたがる機能実装 | [.claude/agents/dev-coordinator.md](.claude/agents/dev-coordinator.md) |
| タスクの振り分け・進捗確認 | [.claude/agents/dev-coordinator.md](.claude/agents/dev-coordinator.md) |
| アーキテクチャ整合性の確認 | [.claude/agents/dev-coordinator.md](.claude/agents/dev-coordinator.md) |

### Mainプロセス開発
| タスク内容 | 参照するサブエージェント |
|-----------|------------------------|
| `app/main/` 配下のコード | [.claude/agents/main-process-developer.md](.claude/agents/main-process-developer.md) |
| IPCハンドラー実装 | [.claude/agents/main-process-developer.md](.claude/agents/main-process-developer.md) |
| CLI実行（ai-runner, shell-runner） | [.claude/agents/main-process-developer.md](.claude/agents/main-process-developer.md) |
| コマンドパーサー・エイリアス解決 | [.claude/agents/main-process-developer.md](.claude/agents/main-process-developer.md) |
| electron-store永続化 | [.claude/agents/main-process-developer.md](.claude/agents/main-process-developer.md) |

### Renderer/UIレビュー
| タスク内容 | 参照するサブエージェント |
|-----------|------------------------|
| `app/renderer/` 配下のコード | [.claude/agents/renderer-ui-reviewer.md](.claude/agents/renderer-ui-reviewer.md) |
| Reactコンポーネント、Monaco、xterm.js | [.claude/agents/renderer-ui-reviewer.md](.claude/agents/renderer-ui-reviewer.md) |
| UI/UXレビュー・品質検査 | [.claude/agents/renderer-ui-reviewer.md](.claude/agents/renderer-ui-reviewer.md) |
| レイアウト・レスポンシブ対応 | [.claude/agents/renderer-ui-reviewer.md](.claude/agents/renderer-ui-reviewer.md) |

### 共有型定義
| タスク内容 | 参照するサブエージェント |
|-----------|------------------------|
| `app/shared/` 配下のコード | [.claude/agents/shared-types-guardian.md](.claude/agents/shared-types-guardian.md) |
| 型定義、IPCチャンネル定義 | [.claude/agents/shared-types-guardian.md](.claude/agents/shared-types-guardian.md) |
| Main↔Renderer間の型契約 | [.claude/agents/shared-types-guardian.md](.claude/agents/shared-types-guardian.md) |

---

## コーディング規約

### TypeScript
- `strict: true` を有効化
- `any` の使用は原則禁止（やむを得ない場合は `// eslint-disable-next-line` でコメント）
- 型は `app/shared/types/` に集約
- インターフェースは `I` プレフィックスを付けない（例: `Settings`, not `ISettings`）

### React
- 関数コンポーネントのみ使用（クラスコンポーネント禁止）
- Hooks は `use` プレフィックス
- コンポーネントファイルは PascalCase（例: `CommandBar.tsx`）
- 1ファイル1コンポーネントを原則とする

### Electron
- `contextIsolation: true` を必須
- `nodeIntegration: false` を必須
- preload経由でのみRenderer↔Main間通信
- 危険なAPIは公開しない

### ファイル命名
- TypeScript: `kebab-case.ts` または `PascalCase.tsx`（コンポーネント）
- テスト: `*.test.ts` または `*.spec.ts`
- 設定ファイル: 標準命名に従う（`tsconfig.json`, `vite.config.ts`）

---

## コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/) に従う。

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット（コード動作に影響なし）
- `refactor`: リファクタリング
- `test`: テスト追加/修正
- `chore`: ビルド/ツール変更

### Scope（任意）
- `main`: Mainプロセス
- `renderer`: Rendererプロセス
- `shared`: 共有コード
- `build`: ビルド設定

### 例
```
feat(renderer): Monaco Editorの複数行入力を実装

- Enter で改行
- Cmd+Enter で送信
- 選択範囲のみ送信にも対応

Closes #12
```

---

## セキュリティ要件

### 必須設定
```typescript
// main.ts での BrowserWindow 設定
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,      // 必須
    nodeIntegration: false,      // 必須
    sandbox: true,               // 推奨
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

### 禁止事項
- `shell.openExternal()` に未検証のURLを渡さない
- `eval()` の使用禁止
- ユーザー入力をそのままコマンドに渡さない（サニタイズ必須）

### 履歴データ
- 履歴の暗号化は必須ではないが、削除機能は必須
- 保存のON/OFF切替を実装すること

---

## 非機能要件

| 項目 | 要件 |
|------|------|
| 起動時間 | 2秒以内 |
| UI応答性 | 非同期I/Oを徹底し、フリーズを防ぐ |
| 対応OS | macOS優先、将来Windows/Linux対応 |

---

## 開発フロー

1. **型定義を先行** - `shared-types-guardian` エージェントを使用してIPC型を確定
2. **タスク振り分け** - 複雑なタスクは `dev-coordinator` エージェントがサブエージェントに振り分け
3. **並列開発** - `main-process-developer` と `renderer-ui-reviewer` が独立して開発・レビュー
4. **結合テスト** - IPC通信の結合後に E2E テスト実施

### 並列実行オーケストレーション

`dev-coordinator` エージェントは、Claude Code CLIのTask機能を活用してサブエージェントを並列実行します。

#### 実行フロー

```
ユーザーリクエスト
    ↓
dev-coordinator: 要件分析・タスク分解
    ↓
Phase 2: 型定義（直列実行）
    → shared-types-guardian: 型定義作成
    → 完了レポート待ち
    ↓
Phase 3: 実装（並列実行）
    ├─→ main-process-developer: Main実装
    └─→ renderer-ui-reviewer: Renderer実装
    → 両方の完了レポート待ち
    ↓
Phase 4: 統合レビュー
    → dev-coordinator: 統合レビュー・最終報告
```

#### 依存関係

- **型定義**は実装の前に完了必須（直列実行）
- **Main実装**と**Renderer実装**は型定義完了後、並列実行可能
- **統合レビュー**は両方の実装完了後に実施

詳細は [.claude/agents/dev-coordinator.md](.claude/agents/dev-coordinator.md) の「Parallel Execution Protocol」セクションを参照してください。

---

## 参照ドキュメント

- [要件定義_完成版.md](要件定義_完成版.md)
- [アーキテクチャ_完成版.md](アーキテクチャ_完成版.md)
- [技術スタック_完成版.md](技術スタック_完成版.md)
