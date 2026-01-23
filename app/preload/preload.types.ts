/**
 * Preload Script Type Definitions
 *
 * Rendererプロセスに公開するAPIの型定義。
 * このファイルは型定義のみを含み、実装は含まない。
 */

import type { IpcRendererEvent } from 'electron';

import type {
  IPCInvokeName,
  IPCInvokeRequest,
  IPCInvokeResponse,
  IPCSendName,
  IPCEventName,
  IPCEventPayload,
} from '@shared/types';

/**
 * IPC API型定義
 *
 * Rendererプロセスに公開するAPIの型を定義する。
 * 型安全性を確保するため、全てのIPC呼び出しはこのインターフェース経由で行う。
 */
export interface ElectronAPI {
  /**
   * invokeチャンネル (戻り値あり)
   */
  invoke: <C extends IPCInvokeName>(
    channel: C,
    ...args: IPCInvokeRequest<C> extends void
      ? []
      : IPCInvokeRequest<C> extends Record<string, never>
        ? []
        : [IPCInvokeRequest<C>]
  ) => Promise<IPCInvokeResponse<C>>;

  /**
   * sendチャンネル (戻り値なし)
   * 現在の設計では全てのチャンネルがinvokeを使用するため、このメソッドは使用されない
   */
  send: <C extends IPCSendName>(channel: C, ...args: never[]) => void;

  /**
   * イベントリスナー登録
   */
  on: <C extends IPCEventName>(
    channel: C,
    listener: (event: IpcRendererEvent, payload: IPCEventPayload<C>) => void,
  ) => void;

  /**
   * イベントリスナー解除
   */
  off: <C extends IPCEventName>(
    channel: C,
    listener: (event: IpcRendererEvent, payload: IPCEventPayload<C>) => void,
  ) => void;

  /**
   * 一度だけ実行されるイベントリスナー登録
   */
  once: <C extends IPCEventName>(
    channel: C,
    listener: (event: IpcRendererEvent, payload: IPCEventPayload<C>) => void,
  ) => void;

  /**
   * 全てのリスナーを解除
   */
  removeAllListeners: <C extends IPCEventName>(channel: C) => void;
}

/**
 * グローバル型拡張
 *
 * この定義により、Rendererプロセスで
 * window.electronAPI を型安全に使用できるようになる。
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
