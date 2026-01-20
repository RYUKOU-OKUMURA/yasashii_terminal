# Renderer/UI サブエージェント

このファイルは `app/renderer/` 配下のコードを担当するサブエージェントの定義です。

## 担当範囲

- `app/renderer/` 配下のすべてのコード
- Reactコンポーネント設計・実装
- Monaco Editor統合
- xterm.js統合
- Zustand状態管理

---

## ファイル構成

```
app/renderer/
├── App.tsx                      # ルートコンポーネント
├── main.tsx                     # エントリーポイント
├── components/
│   ├── Layout/
│   │   ├── Layout.tsx           # 3ペインレイアウト
│   │   ├── ResizablePane.tsx    # リサイズ可能なペイン
│   │   └── index.ts
│   ├── Editor/
│   │   ├── Editor.tsx           # Monaco Editorラッパー
│   │   ├── useEditorKeymap.ts   # キーバインド設定
│   │   └── index.ts
│   ├── Output/
│   │   ├── Output.tsx           # xterm.jsラッパー
│   │   ├── useTerminal.ts       # ターミナル制御Hook
│   │   └── index.ts
│   ├── CommandBar/
│   │   ├── CommandBar.tsx       # 日本語コマンドバー
│   │   ├── CommandPreview.tsx   # 変換プレビュー
│   │   ├── Suggestions.tsx      # 補完候補
│   │   └── index.ts
│   └── Settings/
│       ├── SettingsModal.tsx    # 設定モーダル
│       ├── AliasEditor.tsx      # エイリアス編集
│       └── index.ts
├── stores/
│   ├── editor-store.ts          # エディタ状態
│   ├── terminal-store.ts        # ターミナル状態
│   └── settings-store.ts        # 設定状態（Rendererキャッシュ）
├── hooks/
│   ├── useIPC.ts                # IPC通信Hook
│   └── useKeyboardShortcut.ts   # キーボードショートカット
├── styles/
│   ├── global.css               # グローバルスタイル
│   ├── variables.css            # CSS変数
│   └── themes/
│       ├── light.css
│       └── dark.css
└── utils/
    └── ipc-client.ts            # IPC クライアントラッパー
```

---

## 3ペインレイアウト仕様

```
┌─────────────────────────────────────────┐
│              Output (上部)               │
│  CLI出力のストリーミング表示               │
│  ・AI応答                                │
│  ・コマンド実行結果                       │
├─────────────────────────────────────────┤
│              Editor (中部)               │
│  複数行入力エリア                         │
│  ・Enter = 改行                          │
│  ・Cmd+Enter = 送信                      │
├─────────────────────────────────────────┤
│           CommandBar (下部)              │
│  日本語コマンド入力 + 補完 + プレビュー     │
└─────────────────────────────────────────┘
```

---

## 実装パターン

### レイアウトコンポーネント（Layout.tsx）

```tsx
import { useState } from 'react';
import { Output } from '../Output';
import { Editor } from '../Editor';
import { CommandBar } from '../CommandBar';
import styles from './Layout.module.css';

export function Layout() {
  const [outputHeight, setOutputHeight] = useState(40); // %
  const [editorHeight, setEditorHeight] = useState(45); // %
  // commandBar は残り

  return (
    <div className={styles.container}>
      <div 
        className={styles.output} 
        style={{ height: `${outputHeight}%` }}
      >
        <Output />
      </div>
      
      <div 
        className={styles.resizer} 
        onMouseDown={(e) => handleResize(e, 'output')}
      />
      
      <div 
        className={styles.editor} 
        style={{ height: `${editorHeight}%` }}
      >
        <Editor />
      </div>
      
      <div 
        className={styles.resizer} 
        onMouseDown={(e) => handleResize(e, 'editor')}
      />
      
      <div className={styles.commandBar}>
        <CommandBar />
      </div>
    </div>
  );
}
```

### Monaco Editorコンポーネント（Editor.tsx）

```tsx
import { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '../../stores/editor-store';
import { useIPC } from '../../hooks/useIPC';

export function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { content, setContent } = useEditorStore();
  const { send } = useIPC();

  useEffect(() => {
    if (!containerRef.current) return;

    editorRef.current = monaco.editor.create(containerRef.current, {
      value: content,
      language: 'plaintext',
      theme: 'vs-dark',
      minimap: { enabled: false },
      lineNumbers: 'off',
      wordWrap: 'on',
      fontSize: 14,
      padding: { top: 12, bottom: 12 },
      automaticLayout: true,
    });

    // 内容変更を監視
    editorRef.current.onDidChangeModelContent(() => {
      setContent(editorRef.current?.getValue() || '');
    });

    // キーバインド: Cmd+Enter で送信
    editorRef.current.addAction({
      id: 'send-to-ai',
      label: 'Send to AI',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      ],
      run: (editor) => {
        const selection = editor.getSelection();
        const model = editor.getModel();
        
        let textToSend: string;
        
        if (selection && !selection.isEmpty()) {
          // 選択範囲がある場合はそれを送信
          textToSend = model?.getValueInRange(selection) || '';
        } else {
          // 全体を送信
          textToSend = editor.getValue();
        }
        
        if (textToSend.trim()) {
          send('terminal:execute', textToSend);
        }
      },
    });

    return () => {
      editorRef.current?.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ height: '100%' }} />;
}
```

### xterm.jsコンポーネント（Output.tsx）

```tsx
import { useRef, useEffect } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useIPC } from '../../hooks/useIPC';
import 'xterm/css/xterm.css';

export function Output() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { on, off } = useIPC();

  useEffect(() => {
    if (!containerRef.current) return;

    // Terminal初期化
    terminalRef.current = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, monospace',
      cursorBlink: false,
      disableStdin: true, // 読み取り専用
    });

    // FitAddon
    fitAddonRef.current = new FitAddon();
    terminalRef.current.loadAddon(fitAddonRef.current);

    // DOMにアタッチ
    terminalRef.current.open(containerRef.current);
    fitAddonRef.current.fit();

    // IPC: 出力を受信
    const handleOutput = (data: string) => {
      terminalRef.current?.write(data);
    };

    on('terminal:output', handleOutput);

    // リサイズ対応
    const resizeObserver = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      off('terminal:output', handleOutput);
      resizeObserver.disconnect();
      terminalRef.current?.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ height: '100%' }} />;
}
```

### コマンドバー（CommandBar.tsx）

```tsx
import { useState, useCallback } from 'react';
import { useIPC } from '../../hooks/useIPC';
import { Suggestions } from './Suggestions';
import { CommandPreview } from './CommandPreview';
import styles from './CommandBar.module.css';

export function CommandBar() {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ key: string; value: string }>>([]);
  const { invoke, send } = useIPC();

  const handleInputChange = useCallback(async (value: string) => {
    setInput(value);
    
    // プレビューを取得
    const resolved = await invoke('command:preview', value);
    setPreview(resolved);
    
    // 補完候補を取得
    const sugg = await invoke('command:suggestions', value);
    setSuggestions(sugg);
  }, [invoke]);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    
    // 日本語コマンドを解決して実行
    send('terminal:execute', preview || input);
    setInput('');
    setPreview('');
    setSuggestions([]);
  }, [input, preview, send]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="日本語コマンドを入力..."
          className={styles.input}
        />
        <button onClick={handleSubmit} className={styles.submitButton}>
          実行
        </button>
      </div>
      
      {preview && preview !== input && (
        <CommandPreview original={input} resolved={preview} />
      )}
      
      {suggestions.length > 0 && (
        <Suggestions 
          items={suggestions} 
          onSelect={(item) => setInput(item.key)}
        />
      )}
    </div>
  );
}
```

### Zustand状態管理（editor-store.ts）

```typescript
import { create } from 'zustand';

interface EditorState {
  content: string;
  setContent: (content: string) => void;
  clear: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  setContent: (content) => set({ content }),
  clear: () => set({ content: '' }),
}));
```

### IPC通信Hook（useIPC.ts）

```typescript
import { useCallback, useEffect, useRef } from 'react';

// preloadで公開されたAPI
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      send: (channel: string, ...args: unknown[]) => void;
      on: (channel: string, callback: (...args: unknown[]) => void) => void;
      off: (channel: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export function useIPC() {
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());

  const invoke = useCallback(async <T>(channel: string, ...args: unknown[]): Promise<T> => {
    return window.electronAPI.invoke(channel, ...args) as Promise<T>;
  }, []);

  const send = useCallback((channel: string, ...args: unknown[]) => {
    window.electronAPI.send(channel, ...args);
  }, []);

  const on = useCallback((channel: string, callback: (...args: unknown[]) => void) => {
    window.electronAPI.on(channel, callback);
    
    if (!listenersRef.current.has(channel)) {
      listenersRef.current.set(channel, new Set());
    }
    listenersRef.current.get(channel)?.add(callback);
  }, []);

  const off = useCallback((channel: string, callback: (...args: unknown[]) => void) => {
    window.electronAPI.off(channel, callback);
    listenersRef.current.get(channel)?.delete(callback);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      listenersRef.current.forEach((callbacks, channel) => {
        callbacks.forEach((cb) => {
          window.electronAPI.off(channel, cb as (...args: unknown[]) => void);
        });
      });
    };
  }, []);

  return { invoke, send, on, off };
}
```

---

## キーバインド仕様

| キー | 動作 | 場所 |
|------|------|------|
| Enter | 改行 | Editor |
| Cmd+Enter (Ctrl+Enter) | 送信 | Editor |
| Cmd+A | 全選択 | Editor |
| Cmd+Z | Undo | Editor |
| Cmd+Shift+Z | Redo | Editor |
| Cmd+C | コピー | Editor |
| Cmd+V | ペースト | Editor |
| Enter | 実行 | CommandBar |
| Tab | 補完選択 | CommandBar |
| Escape | 補完閉じる | CommandBar |
| Cmd+K | ログクリア | グローバル |
| Cmd+, | 設定を開く | グローバル |

---

## スタイリング方針

### CSS変数（variables.css）

```css
:root {
  /* カラーパレット */
  --color-bg-primary: #1e1e1e;
  --color-bg-secondary: #252526;
  --color-bg-tertiary: #2d2d30;
  --color-text-primary: #d4d4d4;
  --color-text-secondary: #808080;
  --color-accent: #0078d4;
  --color-error: #f14c4c;
  --color-warning: #cca700;
  --color-success: #89d185;

  /* スペーシング */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* フォント */
  --font-family-ui: 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
  --font-family-mono: 'Menlo', 'Monaco', 'Consolas', monospace;
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 16px;

  /* ボーダー */
  --border-radius: 4px;
  --border-color: #3c3c3c;
}
```

### コンポーネントスタイル

- CSS Modules を使用（`*.module.css`）
- BEM命名規則は不要（CSS Modulesでスコープ化）
- レスポンシブ対応は不要（デスクトップアプリ）

---

## 禁止事項

1. **`require()` の使用禁止** - ES Modulesを使用
2. **`window.require()` の使用禁止** - preload経由でAPI公開
3. **インラインスタイルの多用禁止** - CSS Modulesを使用
4. **クラスコンポーネント禁止** - 関数コンポーネントのみ
5. **`any` 型の使用禁止** - 適切な型定義を使用

---

## チェックリスト

新しいコンポーネントを追加する際は、以下を確認してください：

- [ ] 関数コンポーネントで実装されているか
- [ ] TypeScriptの型が適切に定義されているか
- [ ] CSS Modulesでスタイリングされているか
- [ ] IPC通信は `useIPC` Hook経由か
- [ ] メモリリーク対策（useEffectのクリーンアップ）は実装されているか
- [ ] アクセシビリティ（キーボード操作、aria属性）は考慮されているか
