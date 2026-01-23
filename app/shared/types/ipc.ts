/**
 * IPCチャンネル定義
 *
 * Main↔Renderer間のIPC通信に使用するチャンネルとその型を定義する。
 *
 * 型安全性の観点から、以下のルールに従うこと:
 * - Renderer→Main: invoke (戻り値あり) / send (戻り値なし)
 * - Main→Renderer: send (イベント送信)
 */

/**
 * ============================================================================
 * IPCチャンネル定義
 * ============================================================================
 */

/**
 * IPCチャンネルごとのリクエスト/レスポンス/イベント型定義
 */
export interface IPCChannels {
  // ターミナル実行
  'terminal:execute': {
    request: { command: string; cwd?: string };
    response: void;
  };
  'terminal:output': {
    event: { data: string; type: 'stdout' | 'stderr' };
  };
  'terminal:clear': {
    request: void;
    response: void;
  };

  // コマンド変換/プレビュー
  'command:preview': {
    request: { input: string };
    response: { original: string; converted: string; command: string };
  };

  // 設定
  'settings:get': {
    request: void;
    response: Settings;
  };
  'settings:set': {
    request: { settings: Partial<Settings> };
    response: void;
  };
  'settings:get-aliases': {
    request: void;
    response: AliasMap;
  };
  'settings:set-alias': {
    request: { key: string; value: string };
    response: void;
  };
  'settings:delete-alias': {
    request: { key: string };
    response: void;
  };
  'settings:changed': {
    event: Settings;
  };

  // 履歴
  'history:get': {
    request: { limit?: number };
    response: HistoryEntry[];
  };
  'history:add': {
    request: { entry: Omit<HistoryEntry, 'id' | 'timestamp'> };
    response: void;
  };
  'history:clear': {
    request: void;
    response: void;
  };
  'history:delete': {
    request: { id: string };
    response: void;
  };
  'history:toggled': {
    event: { enabled: boolean };
  };

  // AI CLI
  'ai:execute': {
    request: { prompt: string; tool: 'claude' | 'codex' | 'gemini' };
    response: void;
  };
  'ai:output': {
    event: { data: string; type: 'stdout' | 'stderr' | 'error' };
  };
  'ai:started': {
    event: { tool: string };
  };
  'ai:finished': {
    event: { tool: string; exitCode: number | null };
  };
}

/**
 * ============================================================================
 * チャンネル分類型
 * ============================================================================
 */

/**
 * invokeチャンネル名のリテラル型 (戻り値あり)
 */
export type IPCInvokeName =
  | 'terminal:execute'
  | 'terminal:clear'
  | 'command:preview'
  | 'settings:get'
  | 'settings:set'
  | 'settings:get-aliases'
  | 'settings:set-alias'
  | 'settings:delete-alias'
  | 'history:get'
  | 'history:add'
  | 'history:clear'
  | 'history:delete'
  | 'ai:execute';

/**
 * sendチャンネル名のリテラル型 (戻り値なし、一方通行)
 * 現在の設計では全てのチャンネルがinvokeを使用する
 */
export type IPCSendName = never;

/**
 * イベントチャンネル名のリテラル型 (Main→Renderer)
 */
export type IPCEventName =
  | 'terminal:output'
  | 'settings:changed'
  | 'history:toggled'
  | 'ai:output'
  | 'ai:started'
  | 'ai:finished';

/**
 * ============================================================================
 * 型ヘルパー
 * ============================================================================
 */

/**
 * invokeリクエスト型
 */
export type IPCInvokeRequest<C extends IPCInvokeName> = IPCChannels[C]['request'];

/**
 * invokeレスポンス型
 */
export type IPCInvokeResponse<C extends IPCInvokeName> = IPCChannels[C]['response'];

/**
 * イベントペイロード型
 */
export type IPCEventPayload<C extends IPCEventName> = IPCChannels[C]['event'];

/**
 * ============================================================================
 * 依存型定義
 * ============================================================================
 */

/**
 * 設定
 */
export interface Settings {
  // エイリアス設定
  aliases: AliasMap;
  // 履歴設定
  history: {
    enabled: boolean;
    maxEntries: number;
    persistPath: string | null;
  };
  // エディタ設定
  editor: {
    fontSize: number;
    fontFamily: string;
    theme: 'vs-dark' | 'vs-light' | 'hc-black';
    wordWrap: 'on' | 'off' | 'wordWrapColumn';
    minimap: boolean;
  };
  // ターミナル設定
  terminal: {
    fontSize: number;
    fontFamily: string;
    theme: 'dark' | 'light';
    scrollback: number;
    cursorBlink: boolean;
  };
  // AI CLI設定
  aiTools: {
    claude: {
      command: string; // 例: 'claude' またはフルパス
      enabled: boolean;
    };
    codex: {
      command: string;
      enabled: boolean;
    };
    gemini: {
      command: string;
      enabled: boolean;
    };
  };
  // その他
  language: 'ja' | 'en';
  autoSave: boolean;
}

/**
 * エイリアスマップ
 */
export type AliasMap = Record<string, string>;

/**
 * 履歴エントリ
 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'ai' | 'command';
  input: string;
  converted?: string; // コマンドの場合、変換後のコマンド
  tool?: 'claude' | 'codex' | 'gemini'; // AIの場合、使用ツール
  exitCode?: number | null;
  duration?: number; // 実行時間(ms)
}

/**
 * ターミナル出力データ
 */
export interface TerminalOutputData {
  data: string;
  type: 'stdout' | 'stderr';
  timestamp: number;
}

/**
 * コマンド変換結果
 */
export interface CommandPreview {
  original: string; // 元の入力
  converted: string; // 変換後の表示文字列
  command: string; // 実際に実行するコマンド
  aliases?: { key: string; value: string }[]; // 使用されたエイリアス
}

/**
 * 互換性のための型エイリアス
 */
export type IPCInvokeChannel = IPCInvokeName;
export type IPCSendChannel = IPCSendName;
export type IPCEventChannel = IPCEventName;
