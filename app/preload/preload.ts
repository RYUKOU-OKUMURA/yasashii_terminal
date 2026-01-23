/**
 * Preload Script
 *
 * RendererプロセスとMainプロセス間の安全なIPCブリッジを提供する。
 *
 * セキュリティ要件:
 * - contextIsolation: true で動作することを前提
 * - nodeIntegration: false であること
 * - 必要最小限のAPIのみをRendererに公開する
 *
 * @see https://www.electronjs.org/docs/latest/tutorial/context-isolation
 */

import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

import type {
  IPCInvokeName,
  IPCSendName,
  IPCEventName,
  IPCInvokeResponse,
} from '@shared/types';

/**
 * 型安全なIPC invoke呼び出し
 */
function invoke<C extends IPCInvokeName>(
  channel: C,
  ...args: unknown[]
): Promise<IPCInvokeResponse<C>> {
  return ipcRenderer.invoke(channel, ...args);
}

/**
 * 型安全なIPC send呼び出し
 */
function send<C extends IPCSendName>(channel: C, ...args: unknown[]): void {
  ipcRenderer.send(channel, ...args);
}

/**
 * 型安全なイベントリスナー登録
 */
function on<C extends IPCEventName>(
  channel: C,
  listener: (event: IpcRendererEvent, ...args: unknown[]) => void,
): void {
  ipcRenderer.on(channel, listener);
}

/**
 * 型安全なイベントリスナー解除
 */
function off<C extends IPCEventName>(
  channel: C,
  listener: (event: IpcRendererEvent, ...args: unknown[]) => void,
): void {
  ipcRenderer.off(channel, listener);
}

/**
 * 型安全な一度だけ実行されるイベントリスナー登録
 */
function once<C extends IPCEventName>(
  channel: C,
  listener: (event: IpcRendererEvent, ...args: unknown[]) => void,
): void {
  ipcRenderer.once(channel, listener);
}

/**
 * 全てのリスナーを解除
 */
function removeAllListeners<C extends IPCEventName>(channel: C): void {
  ipcRenderer.removeAllListeners(channel);
}

/**
 * Rendererプロセスに公開するAPIオブジェクト
 */
const electronApi = {
  invoke,
  send,
  on,
  off,
  once,
  removeAllListeners,
};

/**
 * contextBridge 経由でRendererプロセスに型安全なAPIを公開する
 *
 * これによりRendererプロセスから window.electronAPI 経由で
 * Mainプロセスと通信できるようになる。
 */
contextBridge.exposeInMainWorld('electronAPI', electronApi);

/**
 * TypeScript用型定義のエクスポート
 *
 * この型定義はRendererプロセスからインポートして使用する。
 */
export type { ElectronAPI } from './preload.types.js';

/**
 * 型アサーション用の型ガード
 *
 * 実行時にelectronAPIが利用可能かチェックする際に使用する。
 */
export const isElectronAPIAvailable = (): boolean => {
  // @ts-expect-error - globalThis.window is runtime check
  const w = globalThis.window as { electronAPI?: unknown } | undefined;
  return (
    typeof w !== 'undefined' &&
    Reflect.has(w, 'electronAPI') &&
    w.electronAPI !== null &&
    typeof w.electronAPI === 'object'
  );
};
