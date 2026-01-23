/**
 * Electron Main Process Entry Point
 *
 * メインプロセスのエントリーポイント。
 *
 * セキュリティ要件（CLAUDE.md参照）:
 * - contextIsolation: true (必須)
 * - nodeIntegration: false (必須)
 * - sandbox: true (推奨)
 */

import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * BrowserWindowインスタンス
 */
let mainWindow: BrowserWindow | null = null;

/**
 * メインウィンドウを作成する
 *
 * セキュリティ設定を適用し、Rendererプロセスを起動する。
 */
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    show: false, // ロード完了まで表示を遅延させる
    webPreferences: {
      // セキュリティ必須設定
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // 一時的に無効化して問題調査中

      // Preloadスクリプト
      preload: join(__dirname, '../preload/preload.js'),
    },
  });

  // 開発時はDevToolsを開く
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Rendererプロセスを読み込む
  if (process.env.NODE_ENV === 'development') {
    // 開発時はViteの開発サーバーを使用
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.on('did-fail-load', () => {
      // Viteサーバーが起動していない場合はリトライ
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.loadURL('http://localhost:5173');
        }
      }, 1000);
    });
  } else {
    // 本番時はビルド済みファイルを使用
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }

  // ウィンドウが閉じられる際のクリーンアップ
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // ロード完了後にウィンドウを表示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 外部URLをブラウザで開く（セキュリティ対策）
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 許可するドメインリスト（必要に応じて追加）
    const allowedDomains = ['github.com', 'anthropic.com'];
    const isAllowed = allowedDomains.some((domain) => url.includes(domain));

    if (isAllowed) {
      return { action: 'allow', overrideBrowserWindowOptions: {} };
    }
    return { action: 'deny' };
  });
}

/**
 * Electronアプリが準備完了した際のハンドラー
 */
app.whenReady().then(() => {
  createMainWindow();
  setupIpcHandlers();

  // macOSでDockアイコンがクリックされた際の処理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

/**
 * 全てのウィンドウが閉じられた際の処理
 *
 * macOS以外ではアプリを終了する。
 * macOSではメニューバーからの起動を可能にするため、終了しない。
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * IPCハンドラーを設定する
 *
 * RendererプロセスからのIPCリクエストを処理する。
 *
 * @note 実際のハンドラー実装は ipc-handlers.ts に移譲する
 */
function setupIpcHandlers(): void {
  // ターミナル実行
  ipcMain.handle(
    'terminal:execute',
    async (_event: IpcMainInvokeEvent, { command, cwd }: { command: string; cwd?: string }) => {
      // TODO: shell-runner.ts に実装を移譲
      console.log('terminal:execute', { command, cwd });
    },
  );

  ipcMain.on('terminal:clear', () => {
    // TODO: 実装
    console.log('terminal:clear');
  });

  // コマンド変換/プレビュー
  ipcMain.handle(
    'command:preview',
    async (_event: IpcMainInvokeEvent, { input }: { input: string }) => {
      // TODO: command-parser に実装を移譲
      console.log('command:preview', { input });
      return { original: input, converted: input, command: input };
    },
  );

  // 設定
  ipcMain.handle('settings:get', async () => {
    // TODO: settings-store.ts に実装を移譲
    console.log('settings:get');
    return {};
  });

  ipcMain.handle(
    'settings:set',
    async (_event: IpcMainInvokeEvent, { settings }: { settings: unknown }) => {
      console.log('settings:set', settings);
    },
  );

  ipcMain.handle('settings:get-aliases', async () => {
    console.log('settings:get-aliases');
    return {};
  });

  ipcMain.handle(
    'settings:set-alias',
    async (_event: IpcMainInvokeEvent, { key, value }: { key: string; value: string }) => {
      console.log('settings:set-alias', { key, value });
    },
  );

  ipcMain.handle(
    'settings:delete-alias',
    async (_event: IpcMainInvokeEvent, { key }: { key: string }) => {
      console.log('settings:delete-alias', { key });
    },
  );

  // 履歴
  ipcMain.handle(
    'history:get',
    async (_event: IpcMainInvokeEvent, { limit }: { limit?: number }) => {
      console.log('history:get', { limit });
      return [];
    },
  );

  ipcMain.handle(
    'history:add',
    async (_event: IpcMainInvokeEvent, { entry }: { entry: unknown }) => {
      console.log('history:add', entry);
    },
  );

  ipcMain.handle('history:clear', async () => {
    console.log('history:clear');
  });

  ipcMain.handle(
    'history:delete',
    async (_event: IpcMainInvokeEvent, { id }: { id: string }) => {
      console.log('history:delete', { id });
    },
  );

  // AI CLI
  ipcMain.handle(
    'ai:execute',
    async (_event: IpcMainInvokeEvent, { prompt, tool }: { prompt: string; tool: string }) => {
      // TODO: ai-runner.ts に実装を移譲
      console.log('ai:execute', { prompt, tool });
    },
  );
}
