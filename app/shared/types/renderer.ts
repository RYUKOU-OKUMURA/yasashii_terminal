/**
 * RendererプロセスのZustandストア型定義
 *
 * UI状態管理に使用するストアの型を定義する。
 */

import type { Settings, HistoryEntry, TerminalOutputData, CommandPreview } from './ipc.js';

// ============================================================================
// Editor Store
// ============================================================================

/**
 * エディタ状態
 */
export interface EditorState {
  // エディタの内容
  content: string;
  setContent: (content: string) => void;

  // 選択範囲
  selection: string | null;
  setSelection: (selection: string | null) => void;

  // 変更状態
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;

  // カーソル位置
  cursorPosition: { lineNumber: number; column: number };
  setCursorPosition: (position: { lineNumber: number; column: number }) => void;
}

// ============================================================================
// Terminal Store
// ============================================================================

/**
 * ターミナル出力ログ
 */
export interface TerminalLog extends TerminalOutputData {
  id: string;
}

/**
 * ターミナル状態
 */
export interface TerminalState {
  // 出力ログ
  logs: TerminalLog[];
  addLog: (data: Omit<TerminalLog, 'id'>) => void;
  clearLogs: () => void;

  // 実行状態
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;

  // 現在のコマンド
  currentCommand: string | null;
  setCurrentCommand: (command: string | null) => void;
}

// ============================================================================
// Command Store
// ============================================================================

/**
 * コマンドバー状態
 */
export interface CommandState {
  // 入力値
  input: string;
  setInput: (input: string) => void;

  // プレビュー
  preview: CommandPreview | null;
  setPreview: (preview: CommandPreview | null) => void;

  // 補完候補
  suggestions: string[];
  setSuggestions: (suggestions: string[]) => void;

  // 補完のハイライトインデックス
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;

  // 履歴インデックス（履歴遡り用）
  historyIndex: number | null;
  setHistoryIndex: (index: number | null) => void;
}

// ============================================================================
// Settings Store
// ============================================================================

/**
 * 設定状態
 */
export interface SettingsState {
  // 設定値
  settings: Settings | null;
  setSettings: (settings: Settings) => void;

  // ローディング状態
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  // エラー状態
  error: string | null;
  setError: (error: string | null) => void;

  // 設定更新
  updateSettings: (updates: Partial<Settings>) => Promise<void>;

  // エイリアス操作
  getAliases: () => Record<string, string>;
  setAlias: (key: string, value: string) => Promise<void>;
  deleteAlias: (key: string) => Promise<void>;
}

// ============================================================================
// History Store
// ============================================================================

/**
 * 履歴状態
 */
export interface HistoryState {
  // 履歴エントリ
  entries: HistoryEntry[];
  setEntries: (entries: HistoryEntry[]) => void;

  // フィルタリング済み履歴
  filteredEntries: HistoryEntry[];
  setFilteredEntries: (entries: HistoryEntry[]) => void;

  // 検索クエリ
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // ローディング状態
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  // 履歴追加
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => Promise<void>;

  // 履歴削除
  deleteEntry: (id: string) => Promise<void>;

  // 履歴クリア
  clearHistory: () => Promise<void>;
}

// ============================================================================
// App Store (Global)
// ============================================================================

/**
 * アプリ全体の状態
 */
export interface AppState {
  // テーマ
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // 言語
  language: 'ja' | 'en';
  setLanguage: (language: 'ja' | 'en') => void;

  // ウィンドウ状態
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;

  // 通知
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

/**
 * 通知
 */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number; // 自動消去までの時間(ms)。undefinedで自動消去なし
}
