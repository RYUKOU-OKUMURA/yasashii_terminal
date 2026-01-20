```markdown
# やさしいターミナル（仮称）
## 非エンジニア向け日本語ターミナルエミュレータ

---

## 1. 要件定義

### 1.1 プロジェクト概要

| 項目 | 内容 |
|------|------|
| プロジェクト名 | やさしいターミナル（仮） |
| 目的 | 非エンジニアがCLI系AIツール（Claude Code, Codex等）を快適に使えるターミナル |
| ターゲット | プログラミング初心者、非エンジニアの個人事業主 |
| プラットフォーム | macOS（将来的にWindows/Linux対応可） |

### 1.2 コア要件

#### 必須機能（MVP）

| ID | 機能 | 説明 | 優先度 |
|----|------|------|--------|
| F-001 | 複数行入力 | Enterキーで改行、Cmd+Enterで実行 | 🔴 高 |
| F-002 | ターミナル出力表示 | コマンド実行結果をリアルタイム表示 | 🔴 高 |
| F-003 | 日本語エイリアス | 「ファイル一覧」→「ls -la」等の変換 | 🔴 高 |
| F-004 | コマンド履歴 | 過去のコマンドを検索・再利用 | 🟡 中 |
| F-005 | 設定画面 | エイリアス追加・編集のGUI | 🟡 中 |

#### 拡張機能（Phase 2以降）

| ID | 機能 | 説明 | 優先度 |
|----|------|------|--------|
| F-101 | 自然言語パース | 「Documentsに移動」等の柔軟な解釈 | 🟡 中 |
| F-102 | 危険コマンド警告 | rm -rf等の実行前確認 | 🟡 中 |
| F-103 | LLM連携 | ローカルLLMでコマンド生成支援 | 🟢 低 |
| F-104 | タブ機能 | 複数ターミナルセッション | 🟢 低 |
| F-105 | テーマ切替 | ライト/ダーク/カスタム | 🟢 低 |

### 1.3 非機能要件

| カテゴリ | 要件 |
|----------|------|
| パフォーマンス | 起動時間 2秒以内 |
| セキュリティ | contextIsolation有効、sandbox有効 |
| UX | 日本語UIのみ（初期版） |
| 可用性 | オフライン動作可能 |
| 保守性 | 設定ファイルはJSON形式で編集可能 |

### 1.4 日本語コマンド仕様

#### 基本エイリアス（プリセット）

```yaml
# ファイル操作
ファイル一覧: ls -la
隠しファイル含む一覧: ls -la
今いる場所: pwd
移動: cd
戻る: cd ..
ホームに戻る: cd ~
作成: mkdir
削除: rm
コピー: cp
名前変更: mv
中身を見る: cat
検索: find . -name

# Git操作
状態: git status
差分: git diff
履歴: git log --oneline -20
保存: git add . && git commit -m
送信: git push
取得: git pull
ブランチ一覧: git branch -a
切替: git checkout

# AI CLIツール
クロード: claude
コーデックス: codex

# システム
クリア: clear
終了: exit
```

#### 自然言語パターン（Phase 2）

```yaml
# パターン: 入力例 → 変換結果
移動系:
  - "{path}に移動" → "cd {path}"
  - "{path}へ移動" → "cd {path}"
  - "{path}フォルダに移動" → "cd {path}"

作成系:
  - "{name}を作成" → "mkdir {name}"
  - "{name}フォルダを作成" → "mkdir {name}"
  - "{name}ファイルを作成" → "touch {name}"

削除系:
  - "{target}を削除" → "rm {target}"
  - "{target}を消す" → "rm {target}"

表示系:
  - "{file}の中身" → "cat {file}"
  - "{file}を見る" → "cat {file}"
```

---

## 2. アーキテクチャ

### 2.1 システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐     IPC      ┌─────────────────────┐  │
│  │ Renderer Process │◄────────────►│   Main Process      │  │
│  │   (React/UI)     │              │   (Node.js)         │  │
│  │                  │              │                     │  │
│  │ ┌─────────────┐ │              │ ┌─────────────────┐ │  │
│  │ │ Monaco      │ │              │ │ Command Parser  │ │  │
│  │ │ Editor      │ │              │ │ (日本語変換)    │ │  │
│  │ │ (入力)      │ │              │ └────────┬────────┘ │  │
│  │ └─────────────┘ │              │          │          │  │
│  │                  │              │ ┌────────▼────────┐ │  │
│  │ ┌─────────────┐ │              │ │ node-pty        │ │  │
│  │ │ xterm.js    │ │              │ │ (疑似ターミナル) │ │  │
│  │ │ (出力)      │ │              │ └────────┬────────┘ │  │
│  │ └─────────────┘ │              │          │          │  │
│  │                  │              │          ▼          │  │
│  │ ┌─────────────┐ │              │    ┌─────────┐     │  │
│  │ │ Zustand     │ │              │    │ Shell   │     │  │
│  │ │ (状態管理)  │ │              │    │(zsh/bash)│     │  │
│  │ └─────────────┘ │              │    └─────────┘     │  │
│  └─────────────────┘              └─────────────────────┘  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐              ┌─────────────────────┐  │
│  │ Preload Script  │              │ electron-store      │  │
│  │ (contextBridge) │              │ (設定永続化)        │  │
│  └─────────────────┘              └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 ディレクトリ構成

```
yasashii-terminal/
├── app/
│   ├── main/                    # Electronメインプロセス
│   │   ├── main.ts              # エントリーポイント
│   │   ├── ipc-handlers.ts      # IPCハンドラー
│   │   ├── pty-manager.ts       # node-pty管理
│   │   └── command-parser/      # コマンド変換
│   │       ├── index.ts
│   │       ├── alias-resolver.ts    # エイリアス解決
│   │       ├── pattern-matcher.ts   # 自然言語パターン
│   │       └── presets/
│   │           └── ja-commands.json # 日本語コマンド定義
│   │
│   ├── preload/                 # Preloadスクリプト
│   │   └── preload.ts
│   │
│   ├── renderer/                # React UI
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── MainArea.tsx
│   │   │   │   └── StatusBar.tsx
│   │   │   ├── Terminal/
│   │   │   │   ├── OutputArea.tsx      # xterm.js
│   │   │   │   ├── InputArea.tsx       # Monaco Editor
│   │   │   │   └── CommandPreview.tsx  # 変換プレビュー
│   │   │   ├── Settings/
│   │   │   │   ├── SettingsModal.tsx
│   │   │   │   ├── AliasEditor.tsx
│   │   │   │   └── ThemeSelector.tsx
│   │   │   └── Common/
│   │   │       ├── Button.tsx
│   │   │       └── Modal.tsx
│   │   ├── stores/
│   │   │   ├── terminal-store.ts   # ターミナル状態
│   │   │   ├── history-store.ts    # コマンド履歴
│   │   │   └── settings-store.ts   # 設定
│   │   ├── hooks/
│   │   │   ├── useTerminal.ts
│   │   │   └── useCommandParser.ts
│   │   └── styles/
│   │       └── global.css
│   │
│   └── shared/                  # 共有型定義
│       └── types/
│           ├── index.ts
│           ├── commands.ts
│           └── settings.ts
│
├── resources/                   # 静的リソース
│   └── icons/
│
├── package.json
├── tsconfig.json
├── vite.config.mts
└── README.md
```

### 2.3 データフロー

```
┌──────────────────────────────────────────────────────────────────┐
│                        データフロー図                             │
└──────────────────────────────────────────────────────────────────┘

[ユーザー入力]
     │
     ▼
┌─────────────┐
│ Monaco      │  「Documentsに移動」と入力
│ Editor      │  （Enterで改行、Cmd+Enterで実行）
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Command     │  リアルタイムで変換プレビュー表示
│ Preview     │  →「cd Documents」
└──────┬──────┘
       │ Cmd+Enter
       ▼
┌─────────────┐     IPC: terminal:execute
│ IPC Bridge  │ ─────────────────────────────►
└─────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ Command Parser  │
                                    │ 1. エイリアス解決│
                                    │ 2. パターン解析 │
                                    │ 3. 危険チェック │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ node-pty        │
                                    │ pty.write()     │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Shell (zsh)     │
                                    │ コマンド実行     │
                                    └────────┬────────┘
                                             │
       ◄─────────────────────────────────────┘
       │ IPC: terminal:output (streaming)
       ▼
┌─────────────┐
│ xterm.js    │  実行結果をリアルタイム表示
│ Output      │
└─────────────┘
```

### 2.4 IPC通信設計

```typescript
// チャネル定義
interface IPCChannels {
  // ターミナル操作
  'terminal:execute': (command: string) => void;
  'terminal:output': (data: string) => void;
  'terminal:resize': (cols: number, rows: number) => void;
  'terminal:clear': () => void;
  
  // コマンド変換
  'command:parse': (input: string) => ParsedCommand;
  'command:preview': (input: string) => string;
  
  // 設定
  'settings:get': () => Settings;
  'settings:set': (settings: Partial<Settings>) => void;
  'settings:get-aliases': () => AliasMap;
  'settings:set-alias': (key: string, value: string) => void;
  
  // 履歴
  'history:get': (limit?: number) => HistoryEntry[];
  'history:search': (query: string) => HistoryEntry[];
  'history:clear': () => void;
  
  // ウィンドウ
  'window:minimize': () => void;
  'window:maximize': () => void;
  'window:close': () => void;
}
```

---

## 3. 技術スタック

### 3.1 コア技術

| カテゴリ | 技術 | バージョン | 用途 |
|----------|------|------------|------|
| **フレームワーク** | Electron | 39.x | デスクトップアプリ基盤 |
| **UI** | React | 19.x | UIコンポーネント |
| **言語** | TypeScript | 5.x | 型安全な開発 |
| **ビルド** | Vite | 7.x | 高速ビルド・HMR |

### 3.2 主要ライブラリ

| ライブラリ | バージョン | 用途 |
|------------|------------|------|
| **node-pty** | ^1.0.0 | 疑似ターミナル（シェル実行） |
| **xterm.js** | ^5.x | ターミナル出力表示 |
| **@xterm/addon-fit** | ^0.10.x | xterm自動リサイズ |
| **@xterm/addon-web-links** | ^0.11.x | リンククリック対応 |
| **monaco-editor** | ^0.52.x | コード入力エディタ |
| **zustand** | ^5.x | 状態管理 |
| **electron-store** | ^10.x | 設定永続化 |
| **lucide-react** | ^0.460.x | アイコン |

### 3.3 開発ツール

| ツール | 用途 |
|--------|------|
| **Biome** | Lint + Format |
| **Vitest** | ユニットテスト |
| **Playwright** | E2Eテスト |
| **electron-builder** | パッケージング |
| **simple-git-hooks** | Git hooks |

### 3.4 将来的な拡張候補

| 技術 | 用途 | Phase |
|------|------|-------|
| **Ollama** | ローカルLLM連携 | Phase 3 |
| **Anthropic API** | Claude連携 | Phase 3 |
| **fuse.js** | あいまい検索 | Phase 2 |

---

## 4. 開発ロードマップ

### Phase 1: MVP（2-3週間）

```
Week 1:
├── プロジェクト初期化（SnipDiffフォーク）
├── 不要コード削除・リネーム
├── node-pty + xterm.js 基本統合
└── Cmd+Enterで単純なコマンド実行

Week 2:
├── Monaco Editorで複数行入力
├── 基本的な日本語エイリアス実装
├── コマンド履歴（上下キー）
└── 基本UIレイアウト完成

Week 3:
├── 設定永続化
├── エイリアス編集GUI
├── バグ修正・polish
└── v0.1.0 リリース
```

### Phase 2: 自然言語対応（2週間）

```
├── 正規表現パターンマッチャー
├── 変換プレビュー表示
├── 危険コマンド警告
├── カスタムパターン追加GUI
└── v0.2.0 リリース
```

### Phase 3: AI連携（2-3週間）

```
├── Ollama連携（ローカルLLM）
├── コマンド生成支援
├── エラー解説機能
└── v0.3.0 リリース
```

---

## 5. 参考リンク

- [SnipDiff (ベースリポジトリ)](https://github.com/shiroemons/snip_diff)
- [node-pty](https://github.com/microsoft/node-pty)
- [xterm.js](https://xtermjs.org/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Electron](https://www.electronjs.org/)
```

---

こんな感じでどうでしょうか？

特に気になる点や追加したい要件があれば教えてください。このドキュメントを `.md` ファイルとして保存して開発のベースにすることもできます。