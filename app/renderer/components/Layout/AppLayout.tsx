import React from 'react';
import { MonacoEditor } from '../Editor/MonacoEditor';
import { XtermOutput } from '../Output/XtermOutput';

/**
 * 3ペインレイアウトコンポーネント
 *
 * レイアウト構成:
 * - 上部: 出力ペイン (xterm.js)
 * - 中部: エディタペイン (Monaco Editor)
 * - 下部: 日本語コマンドバー
 */
export const AppLayout: React.FC = () => {
  return (
    <div className="app-root">
      {/* 出力ペイン */}
      <div className="pane-output">
        <XtermOutput />
      </div>

      {/* エディタペイン */}
      <div className="pane-editor">
        <MonacoEditor />
      </div>

      {/* コマンドバーペイン */}
      <div className="pane-commandbar">
        <div className="commandbar-placeholder">
          <input type="text" placeholder="日本語コマンドを入力..." disabled />
          <div className="conversion-preview">変換後コマンドがここに表示されます</div>
        </div>
      </div>
    </div>
  );
};
