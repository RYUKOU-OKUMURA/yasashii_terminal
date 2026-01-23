import React, { useRef, useEffect } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

/**
 * xterm.js 出力コンポーネント
 *
 * 機能:
 * - ストリーミング出力表示
 * - 自動リサイズ（FitAddon）
 * - ANSIカラー対応
 */
export const XtermOutput: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // ターミナル初期化
    const terminal = new Terminal({
      cols: 80,
      rows: 24,
      cursorBlink: false,
      fontSize: 13,
      fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
      scrollback: 1000,
      allowTransparency: false,
    });

    // FitAddon をロード
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    fitAddon.current = fit;

    terminal.open(terminalRef.current);
    fit.fit();

    // 初期メッセージ
    terminal.writeln('\x1b[1;36mやさしいターミナル\x1b[0m');
    terminal.writeln('AIへの指示を入力して、\x1b[33mCmd+Enter\x1b[0m で送信してください');
    terminal.writeln('\r\n');

    // リサイズ監視
    const resizeObserver = new ResizeObserver(() => {
      fit.fit();
    });
    resizeObserver.observe(terminalRef.current);

    // TODO: IPC経由で出力データを受信
    // window.electronAPI?.onOutputData((data: string | Uint8Array) => {
    //   terminal.write(data);
    // });

    // TODO: クリアコマンド
    // window.electronAPI?.onClearOutput(() => {
    //   terminal.clear();
    // });

    terminalInstance.current = terminal;

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  return <div ref={terminalRef} className="xterm-output" />;
};
