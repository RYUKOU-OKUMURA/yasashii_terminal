# やさしいターミナル - CLAUDE.md

このファイルはClaude Codeがプロジェクトを理解し、適切に開発を進めるためのルートエージェント定義です。

## オーケストレーション（このプロジェクトの回し方）

前提: Claude Code は起動時にこの `CLAUDE.md` を読み、ここに書かれた運用モデルに従って動きます。

### 役割（tmux常駐チーム: PRESIDENT → boss1 → worker1-3）

- **PRESIDENT**: ユーザー目的を「成功条件」として定義し、スコープ/優先度/品質ゲートを決め、boss1に委譲する
- **boss1**: タスク分解・依存関係整理・並行化・統合を担当し、workerへ割り当てて成果をPRESIDENTへ報告する
- **worker1**: Renderer/UI（体験・操作・見た目・ショートカット）
- **worker2**: Main Process（IPC/実行/永続化/セキュリティ/エラー処理）
- **worker3**: Shared Types/QA（型契約、回帰観点、手動テスト手順、リリース観点）

役割指示書（tmux起動時に投入）:
- `./.ai-team/multiagent/instructions/president.md`
- `./.ai-team/multiagent/instructions/boss.md`
- `./.ai-team/multiagent/instructions/worker.md`（共通）
- `./.ai-team/multiagent/instructions/worker1.md`
- `./.ai-team/multiagent/instructions/worker2.md`
- `./.ai-team/multiagent/instructions/worker3.md`

運用スクリプト:
- 起動: `./.ai-team/multiagent/start.sh`
- 役割投入: `./.ai-team/multiagent/bootstrap.sh`
- 指示送信: `./.ai-team/multiagent/agent-send.sh`

### 起動直後のルール（重要）

- **ユーザーから具体的な依頼が来るまでは、PRESIDENTはboss1/workerへ勝手に作業指示を送らず待機**する（挨拶/疎通確認のみOK）
- boss1/workerも、上位から具体指示が来るまで待機する

### Interface First（契約 → 実装）

Main/Rendererが絡む変更は、まず「契約（型/IF）」を確定してから実装します。

1. worker3（またはshared担当）が **型/IPC契約案** を作る（入力・出力・失敗時）
2. boss1が契約を確定し、worker1/2へ実装タスクとして配る
3. worker1（UI）とworker2（Main）で並列実装し、boss1が統合してPRESIDENTへ報告する

### サブエージェント（Claude Code Task用 / `.claude/agents`）

必要に応じて、Claude Code のサブエージェント（`.claude/agents/*`）へルーティングして作業を分担します（詳細は後述）。

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
mulch_Editor/
├── CLAUDE.md                    # このファイル（ルートエージェント）
├── .ai-team/                    # tmuxマルチエージェント運用
│   └── multiagent/
│       ├── start.sh
│       ├── bootstrap.sh
│       ├── agent-send.sh
│       └── instructions/
├── .claude/                     # Claude設定・サブエージェント定義
│   └── agents/
│       ├── dev-coordinator.md       # 開発コーディネーター（タスク振り分け・進捗管理）
│       ├── main-process-developer.md # Mainプロセス開発担当
│       ├── renderer-ui-reviewer.md   # Renderer/UIレビュー担当
│       └── shared-types-guardian.md  # 共有型定義担当
├── app/
│   ├── main/                    # Electronメインプロセス
│   │   ├── main.ts
│   │   ├── runner/              # CLI実行
│   │   │   ├── ai-runner.ts
│   │   │   └── shell-runner.ts
│   │   └── command-parser/      # 日本語コマンド等（未実装の領域がある前提）
│   ├── preload/
│   │   ├── preload.ts
│   │   └── preload.types.ts
│   ├── renderer/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── styles/
│   └── shared/
│       └── types/               # IPC/Renderer等の型契約
│           ├── index.ts
│           ├── ipc.ts
│           ├── presets.ts
│           ├── renderer.ts
│           └── store.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── biome.json
```

---

## 品質ゲート（最低限の完了条件）

変更を「完了」とみなすために、最低限以下を満たします（タスクに応じて取捨選択）。

- **契約の整合**: Main↔Renderer間の型/契約が `app/shared/types/` にあり、破壊的変更があれば明記されている
- **セキュリティ**: preload経由のみで通信し、危険APIを露出しない（`contextIsolation: true`, `nodeIntegration: false`）
- **エラー設計**: 失敗時の挙動（ユーザー通知/ログ/復帰）を決めている
- **実行確認**: 最低限の手動テスト手順が用意されている（worker3が用意するのが基本）

ローカルで可能なら:
- `npm run lint`
- `npm run typecheck`
- `npm test`

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
- `any` の使用は原則禁止（やむを得ない場合は Biome の抑制コメントで理由を添える）
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
- [.ai-team/SETUP_GUIDE.md](.ai-team/SETUP_GUIDE.md)
- [.ai-team/MULTIAGENT_SETUP_NOTES.md](.ai-team/MULTIAGENT_SETUP_NOTES.md)
