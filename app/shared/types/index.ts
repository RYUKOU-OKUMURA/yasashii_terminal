/**
 * 共有型定義エクスポート
 *
 * MainプロセスとRendererプロセスで共有する型定義を集約する。
 *
 * このファイルから全ての共有型をエクスポートする。
 */

// IPCチャンネルと関連型
export * from './ipc.js';

// プリセットコマンド
export * from './presets.js';

// ストア用型
export * from './store.js';

// Rendererストア型
export * from './renderer.js';
