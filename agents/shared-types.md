# 共有型・IPC定義 サブエージェント

このファイルは `app/shared/` 配下のコードを担当するサブエージェントの定義です。

## 担当範囲

- `app/shared/` 配下のすべてのコード
- IPC チャンネル型定義
- 設定スキーマ
- 履歴エントリ型
- エイリアスマップ型
- 共通ユーティリティ型

---

## ファイル構成

```
app/shared/
└── types/
    ├── index.ts                 # 型のre-export
    ├── ipc.ts                   # IPCチャンネル定義
    ├── settings.ts              # 設定関連型
    ├── history.ts               # 履歴関連型
    ├── command.ts               # コマンド関連型
    └── common.ts                # 共通ユーティリティ型
```

---

## IPC チャンネル定義（ipc.ts）

```typescript
/**
 * IPC チャンネルと引数/戻り値の型定義
 * Main ↔ Renderer 間の通信契約
 */

import type { Settings, AliasMap } from './settings';
import type { HistoryEntry } from './history';
import type { CommandPreviewResult, CommandSuggestion } from './command';

// ===== invoke（リクエスト/レスポンス型）=====

export interface IPCInvokeChannels {
  // 設定
  'settings:get': {
    args: [];
    return: Settings;
  };
  'settings:set': {
    args: [settings: Partial<Settings>];
    return: void;
  };
  'settings:get-aliases': {
    args: [];
    return: AliasMap;
  };
  'settings:set-alias': {
    args: [key: string, value: string];
    return: void;
  };
  'settings:remove-alias': {
    args: [key: string];
    return: void;
  };

  // 履歴
  'history:get': {
    args: [limit?: number];
    return: HistoryEntry[];
  };
  'history:clear': {
    args: [];
    return: void;
  };
  'history:search': {
    args: [query: string, limit?: number];
    return: HistoryEntry[];
  };

  // コマンド解析
  'command:preview': {
    args: [input: string];
    return: CommandPreviewResult;
  };
  'command:suggestions': {
    args: [partial: string];
    return: CommandSuggestion[];
  };

  // システム
  'system:check-cli': {
    args: [cli: string];
    return: CLICheckResult;
  };
}

// ===== send（単方向メッセージ）=====

export interface IPCSendChannels {
  // ターミナル実行
  'terminal:execute': {
    args: [command: string];
  };
  'terminal:abort': {
    args: [];
  };
  'terminal:clear': {
    args: [];
  };
  'terminal:resize': {
    args: [cols: number, rows: number];
  };
}

// ===== on（Main → Renderer イベント）=====

export interface IPCEventChannels {
  'terminal:output': {
    data: string;
  };
  'terminal:exit': {
    code: number;
  };
  'terminal:error': {
    error: ErrorInfo;
  };
}

// ===== 補助型 =====

export interface CLICheckResult {
  installed: boolean;
  path?: string;
  version?: string;
  error?: string;
}

export interface ErrorInfo {
  code: string;
  message: string;
  hint?: string;
}

// ===== 型ヘルパー =====

/**
 * invokeの引数型を取得
 */
export type IPCInvokeArgs<K extends keyof IPCInvokeChannels> = 
  IPCInvokeChannels[K]['args'];

/**
 * invokeの戻り値型を取得
 */
export type IPCInvokeReturn<K extends keyof IPCInvokeChannels> = 
  IPCInvokeChannels[K]['return'];

/**
 * sendの引数型を取得
 */
export type IPCSendArgs<K extends keyof IPCSendChannels> = 
  IPCSendChannels[K]['args'];

/**
 * イベントのデータ型を取得
 */
export type IPCEventData<K extends keyof IPCEventChannels> = 
  IPCEventChannels[K];
```

---

## 設定関連型（settings.ts）

```typescript
/**
 * アプリケーション設定の型定義
 */

/**
 * エイリアスマップ
 * キー: 日本語コマンド
 * 値: 実際のシェルコマンド
 */
export interface AliasMap {
  [key: string]: string;
}

/**
 * テーマ設定
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * エディタ設定
 */
export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  wordWrap: 'on' | 'off' | 'bounded';
  lineNumbers: 'on' | 'off' | 'relative';
  minimap: boolean;
}

/**
 * ターミナル設定
 */
export interface TerminalSettings {
  fontSize: number;
  fontFamily: string;
  cursorBlink: boolean;
  scrollback: number;
}

/**
 * 履歴設定
 */
export interface HistorySettings {
  enabled: boolean;
  maxSize: number;
  savePrompts: boolean;  // AIへのプロンプトを保存するか
}

/**
 * アプリケーション全体の設定
 */
export interface Settings {
  theme: Theme;
  aliases: AliasMap;
  editor: EditorSettings;
  terminal: TerminalSettings;
  history: HistorySettings;
}

/**
 * 設定のデフォルト値
 */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  aliases: {},
  editor: {
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, monospace',
    wordWrap: 'on',
    lineNumbers: 'off',
    minimap: false,
  },
  terminal: {
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, monospace',
    cursorBlink: false,
    scrollback: 1000,
  },
  history: {
    enabled: true,
    maxSize: 1000,
    savePrompts: true,
  },
};
```

---

## 履歴関連型（history.ts）

```typescript
/**
 * 履歴エントリの型定義
 */

/**
 * 履歴エントリの種類
 */
export type HistoryEntryType = 
  | 'command'     // シェルコマンド
  | 'ai-prompt'   // AIへのプロンプト
  | 'ai-response' // AIからの応答

/**
 * 履歴エントリ
 */
export interface HistoryEntry {
  id: string;
  type: HistoryEntryType;
  content: string;
  timestamp: number;       // Unix timestamp
  
  // コマンド実行の場合
  exitCode?: number;
  duration?: number;       // ミリ秒
  
  // AI関連の場合
  cli?: 'claude' | 'codex' | 'gemini';
  
  // オプション
  tags?: string[];
  pinned?: boolean;
}

/**
 * 履歴検索オプション
 */
export interface HistorySearchOptions {
  query?: string;
  type?: HistoryEntryType;
  cli?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}

/**
 * 履歴統計
 */
export interface HistoryStats {
  totalCount: number;
  commandCount: number;
  promptCount: number;
  responseCount: number;
  dateRange: {
    start: number;
    end: number;
  };
}
```

---

## コマンド関連型（command.ts）

```typescript
/**
 * コマンド解析関連の型定義
 */

/**
 * コマンドプレビュー結果
 */
export interface CommandPreviewResult {
  original: string;        // 入力されたコマンド
  resolved: string;        // 解決後のコマンド
  isAlias: boolean;        // エイリアスが適用されたか
  isDangerous: boolean;    // 危険なコマンドか
  dangerReason?: string;   // 危険な理由
}

/**
 * コマンド補完候補
 */
export interface CommandSuggestion {
  key: string;             // 日本語コマンド
  value: string;           // 実際のコマンド
  description?: string;    // 説明
  category?: string;       // カテゴリ（ファイル操作、Git等）
}

/**
 * 危険コマンドパターン
 */
export interface DangerousCommandPattern {
  pattern: RegExp | string;
  reason: string;
  severity: 'warning' | 'critical';
}

/**
 * デフォルトの危険コマンドパターン
 */
export const DANGEROUS_PATTERNS: DangerousCommandPattern[] = [
  {
    pattern: /rm\s+(-rf?|--recursive)\s+[\/~]/,
    reason: 'システムファイルを削除する可能性があります',
    severity: 'critical',
  },
  {
    pattern: /rm\s+-rf?\s+\*/,
    reason: '複数のファイルを一括削除します',
    severity: 'warning',
  },
  {
    pattern: /:(){ :|:& };:/,
    reason: 'フォークボム攻撃のパターンです',
    severity: 'critical',
  },
  {
    pattern: />\s*\/dev\/sd[a-z]/,
    reason: 'ディスクを直接上書きする可能性があります',
    severity: 'critical',
  },
  {
    pattern: /mkfs\./,
    reason: 'ファイルシステムをフォーマットします',
    severity: 'critical',
  },
  {
    pattern: /dd\s+if=.*\s+of=\/dev\//,
    reason: 'ディスクに直接書き込みます',
    severity: 'critical',
  },
];

/**
 * AI CLI種別
 */
export type AICLIType = 'claude' | 'codex' | 'gemini';

/**
 * AI CLI情報
 */
export interface AICLIInfo {
  type: AICLIType;
  command: string;
  aliases: string[];
  description: string;
}

/**
 * サポートするAI CLI一覧
 */
export const SUPPORTED_AI_CLIS: AICLIInfo[] = [
  {
    type: 'claude',
    command: 'claude',
    aliases: ['クロード', 'くろーど'],
    description: 'Claude Code CLI',
  },
  {
    type: 'codex',
    command: 'codex',
    aliases: ['コーデックス', 'こーでっくす'],
    description: 'OpenAI Codex CLI',
  },
  {
    type: 'gemini',
    command: 'gemini',
    aliases: ['ジェミニ', 'じぇみに'],
    description: 'Google Gemini CLI',
  },
];
```

---

## 共通ユーティリティ型（common.ts）

```typescript
/**
 * 共通ユーティリティ型
 */

/**
 * 部分的に必須にする
 */
export type RequiredPartial<T, K extends keyof T> = 
  Partial<T> & Pick<T, K>;

/**
 * 深いPartial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 非同期関数の戻り値型を取得
 */
export type AsyncReturnType<T extends (...args: unknown[]) => Promise<unknown>> = 
  T extends (...args: unknown[]) => Promise<infer R> ? R : never;

/**
 * 結果型（成功/失敗）
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * イベントハンドラー型
 */
export type EventHandler<T = void> = T extends void 
  ? () => void 
  : (data: T) => void;

/**
 * Nullable型
 */
export type Nullable<T> = T | null;

/**
 * 配列の要素型を取得
 */
export type ArrayElement<T> = T extends (infer E)[] ? E : never;
```

---

## re-export（index.ts）

```typescript
// IPC
export type {
  IPCInvokeChannels,
  IPCSendChannels,
  IPCEventChannels,
  IPCInvokeArgs,
  IPCInvokeReturn,
  IPCSendArgs,
  IPCEventData,
  CLICheckResult,
  ErrorInfo,
} from './ipc';

// Settings
export type {
  AliasMap,
  Theme,
  EditorSettings,
  TerminalSettings,
  HistorySettings,
  Settings,
} from './settings';
export { DEFAULT_SETTINGS } from './settings';

// History
export type {
  HistoryEntryType,
  HistoryEntry,
  HistorySearchOptions,
  HistoryStats,
} from './history';

// Command
export type {
  CommandPreviewResult,
  CommandSuggestion,
  DangerousCommandPattern,
  AICLIType,
  AICLIInfo,
} from './command';
export { DANGEROUS_PATTERNS, SUPPORTED_AI_CLIS } from './command';

// Common
export type {
  RequiredPartial,
  DeepPartial,
  AsyncReturnType,
  Result,
  EventHandler,
  Nullable,
  ArrayElement,
} from './common';
```

---

## 型の命名規則

| カテゴリ | 命名パターン | 例 |
|---------|-------------|-----|
| インターフェース | PascalCase | `Settings`, `HistoryEntry` |
| 型エイリアス | PascalCase | `Theme`, `AICLIType` |
| 定数 | SCREAMING_SNAKE_CASE | `DEFAULT_SETTINGS`, `DANGEROUS_PATTERNS` |
| ジェネリック型 | T, K, V, E など | `Result<T, E>` |

---

## バリデーション方針

型定義はコンパイル時のチェックのみ。ランタイムバリデーションが必要な場合は Zod を使用：

```typescript
import { z } from 'zod';

// Zodスキーマ（ランタイムバリデーション用）
export const SettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  aliases: z.record(z.string()),
  editor: z.object({
    fontSize: z.number().min(8).max(32),
    fontFamily: z.string(),
    wordWrap: z.enum(['on', 'off', 'bounded']),
    lineNumbers: z.enum(['on', 'off', 'relative']),
    minimap: z.boolean(),
  }),
  // ...
});

// 型をスキーマから推論
export type ValidatedSettings = z.infer<typeof SettingsSchema>;
```

---

## 禁止事項

1. **`any` 型の使用禁止** - 適切な型を定義する
2. **型の重複定義禁止** - 必ず `shared/types/` からimport
3. **循環参照禁止** - 型ファイル間の循環importを避ける

---

## チェックリスト

新しい型を追加する際は、以下を確認してください：

- [ ] 適切なファイルに配置されているか
- [ ] `index.ts` でre-exportされているか
- [ ] 命名規則に従っているか
- [ ] JSDocコメントが記載されているか
- [ ] 循環参照が発生していないか
