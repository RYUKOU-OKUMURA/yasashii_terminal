/**
 * ストア用型定義
 *
 * electron-store および Zustand で使用する型定義
 */

import type { Settings, HistoryEntry } from './ipc.js';

/**
 * electron-store に保存するデータ構造
 */
export interface StoreSchema {
  settings: Settings;
  history: HistoryEntry[];
}

/**
 * デフォルト設定値
 */
export const DEFAULT_SETTINGS: Settings = {
  aliases: {},
  history: {
    enabled: true,
    maxEntries: 1000,
    persistPath: null,
  },
  editor: {
    fontSize: 14,
    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
    theme: 'vs-dark',
    wordWrap: 'on',
    minimap: false,
  },
  terminal: {
    fontSize: 14,
    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
    theme: 'dark',
    scrollback: 1000,
    cursorBlink: true,
  },
  aiTools: {
    claude: {
      command: 'claude',
      enabled: true,
    },
    codex: {
      command: 'codex',
      enabled: true,
    },
    gemini: {
      command: 'gemini',
      enabled: true,
    },
  },
  language: 'ja',
  autoSave: true,
};

/**
 * Zustand Store共通ジェネリクス
 */
export interface StoreActions<T> {
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  getState: () => T;
  subscribe: (listener: (state: T) => void) => () => void;
}
