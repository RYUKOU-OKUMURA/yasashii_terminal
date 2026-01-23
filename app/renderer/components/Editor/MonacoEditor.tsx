import React, { useRef, useEffect } from 'react';

/**
 * Simple Editor コンポーネント（Monaco Editorの一時代替）
 *
 * 機能:
 * - Enter キーで改行
 * - Cmd+Enter / Ctrl+Enter で送信
 */
export const MonacoEditor: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Cmd+Enter で送信する処理
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      const content = textareaRef.current?.value || '';
      // TODO: IPC経由でMainプロセスに送信
      console.log('[SimpleEditor] Submit:', content);
      // window.electronAPI?.submitCommand(content);
    }
  };

  useEffect(() => {
    // フォーカスを設定
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="monaco-editor-wrapper">
      <textarea
        ref={textareaRef}
        className="simple-editor"
        placeholder="# AIへの指示を入力してください...

- Enter で改行
- Cmd+Enter で送信"
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          height: '100%',
          background: '#1e1e1e',
          color: '#d4d4d4',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          fontSize: '14px',
          lineHeight: '1.5',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
};
