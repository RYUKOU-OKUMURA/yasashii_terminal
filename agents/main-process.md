# Mainプロセス サブエージェント

このファイルは `app/main/` 配下のコードを担当するサブエージェントの定義です。

## 担当範囲

- `app/main/` 配下のすべてのコード
- IPCハンドラー実装
- コマンドパーサー（日本語エイリアス、正規化）
- ランナー（AI CLI実行、シェル実行）
- 設定/履歴ストア

---

## ファイル構成

```
app/main/
├── main.ts                      # エントリーポイント
├── ipc-handlers.ts              # IPCハンドラー集約
├── runner/
│   ├── ai-runner.ts             # AI CLI実行（claude, codex, gemini）
│   └── shell-runner.ts          # 一般シェルコマンド実行
├── command-parser/
│   ├── index.ts                 # パーサーエントリーポイント
│   ├── alias-resolver.ts        # エイリアス解決
│   ├── pattern-matcher.ts       # 自然言語パターンマッチ（Phase 2）
│   └── presets/
│       └── ja-commands.json     # 日本語コマンドプリセット
└── stores/
    ├── settings-store.ts        # 設定永続化
    └── history-store.ts         # 履歴永続化
```

---

## 実装パターン

### IPCハンドラー

```typescript
// ipc-handlers.ts
import { ipcMain } from 'electron';
import type { IPCChannels } from '../shared/types/ipc';

export function registerIPCHandlers(): void {
  // 同期的なハンドラー
  ipcMain.handle('settings:get', async () => {
    return settingsStore.get();
  });

  // ストリーミングを伴うハンドラー
  ipcMain.on('terminal:execute', (event, command: string) => {
    const runner = new ShellRunner();
    
    runner.on('stdout', (data) => {
      event.sender.send('terminal:output', data);
    });
    
    runner.on('stderr', (data) => {
      event.sender.send('terminal:output', data);
    });
    
    runner.execute(command);
  });
}
```

### AI CLI実行（ai-runner.ts）

```typescript
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class AIRunner extends EventEmitter {
  private process: ChildProcess | null = null;

  /**
   * AI CLIを実行し、stdinにプロンプトを送信
   * @param cli - 'claude' | 'codex' | 'gemini'
   * @param prompt - 送信するプロンプト
   */
  async execute(cli: string, prompt: string): Promise<void> {
    this.process = spawn(cli, [], {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // stdinにプロンプトを送信
    this.process.stdin?.write(prompt);
    this.process.stdin?.end();

    // stdoutをストリーミング
    this.process.stdout?.on('data', (data: Buffer) => {
      this.emit('stdout', data.toString());
    });

    // stderrをストリーミング
    this.process.stderr?.on('data', (data: Buffer) => {
      this.emit('stderr', data.toString());
    });

    this.process.on('close', (code) => {
      this.emit('close', code);
    });

    this.process.on('error', (err) => {
      this.emit('error', err);
    });
  }

  /**
   * 実行中のプロセスを中断
   */
  abort(): void {
    if (this.process) {
      this.process.kill('SIGINT');
      this.process = null;
    }
  }
}
```

### シェル実行（shell-runner.ts）

```typescript
import * as pty from 'node-pty';
import { EventEmitter } from 'events';

export class ShellRunner extends EventEmitter {
  private ptyProcess: pty.IPty | null = null;

  /**
   * シェルコマンドを実行（node-pty使用）
   */
  execute(command: string, cwd?: string): void {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'zsh';
    
    this.ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: cwd || process.env.HOME,
      env: process.env as Record<string, string>,
    });

    this.ptyProcess.onData((data) => {
      this.emit('data', data);
    });

    this.ptyProcess.onExit(({ exitCode }) => {
      this.emit('exit', exitCode);
    });

    // コマンドを送信
    this.ptyProcess.write(command + '\r');
  }

  /**
   * 入力を送信
   */
  write(data: string): void {
    this.ptyProcess?.write(data);
  }

  /**
   * リサイズ
   */
  resize(cols: number, rows: number): void {
    this.ptyProcess?.resize(cols, rows);
  }

  /**
   * 終了
   */
  kill(): void {
    this.ptyProcess?.kill();
  }
}
```

### コマンドパーサー（alias-resolver.ts）

```typescript
import presets from './presets/ja-commands.json';

export interface AliasMap {
  [key: string]: string;
}

export class AliasResolver {
  private aliases: AliasMap;

  constructor(customAliases: AliasMap = {}) {
    // プリセット + カスタムエイリアスをマージ
    this.aliases = { ...presets, ...customAliases };
  }

  /**
   * 日本語コマンドを正規化して解決
   */
  resolve(input: string): string {
    const normalized = this.normalize(input);
    
    // 完全一致
    if (this.aliases[normalized]) {
      return this.aliases[normalized];
    }

    // 部分一致（引数付き）
    for (const [key, value] of Object.entries(this.aliases)) {
      if (normalized.startsWith(key + ' ')) {
        const args = normalized.slice(key.length + 1);
        return `${value} ${args}`;
      }
    }

    // マッチしない場合はそのまま返す
    return input;
  }

  /**
   * 揺れを吸収する正規化
   */
  private normalize(input: string): string {
    return input
      .trim()
      .replace(/\s+/g, ' ')           // 連続空白を単一に
      .replace(/　/g, ' ')             // 全角スペースを半角に
      .toLowerCase();
  }

  /**
   * エイリアスを追加
   */
  addAlias(key: string, value: string): void {
    this.aliases[this.normalize(key)] = value;
  }

  /**
   * 補完候補を取得
   */
  getSuggestions(partial: string): Array<{ key: string; value: string }> {
    const normalized = this.normalize(partial);
    return Object.entries(this.aliases)
      .filter(([key]) => key.includes(normalized))
      .map(([key, value]) => ({ key, value }))
      .slice(0, 10);
  }
}
```

### 日本語コマンドプリセット（ja-commands.json）

```json
{
  "ファイル一覧": "ls -la",
  "隠しファイル含む一覧": "ls -la",
  "今いる場所": "pwd",
  "移動": "cd",
  "戻る": "cd ..",
  "ホームに戻る": "cd ~",
  "作成": "mkdir",
  "削除": "rm",
  "コピー": "cp",
  "名前変更": "mv",
  "中身を見る": "cat",
  "検索": "find . -name",
  "状態": "git status",
  "差分": "git diff",
  "履歴": "git log --oneline -20",
  "保存": "git add . && git commit -m",
  "送信": "git push",
  "取得": "git pull",
  "ブランチ一覧": "git branch -a",
  "切替": "git checkout",
  "クロード": "claude",
  "コーデックス": "codex",
  "ジェミニ": "gemini",
  "クリア": "clear",
  "終了": "exit"
}
```

### 設定ストア（settings-store.ts）

```typescript
import Store from 'electron-store';
import type { Settings, AliasMap } from '../shared/types';

interface SettingsSchema {
  aliases: AliasMap;
  historyEnabled: boolean;
  maxHistorySize: number;
  theme: 'light' | 'dark' | 'system';
}

const defaults: SettingsSchema = {
  aliases: {},
  historyEnabled: true,
  maxHistorySize: 1000,
  theme: 'system',
};

export class SettingsStore {
  private store: Store<SettingsSchema>;

  constructor() {
    this.store = new Store<SettingsSchema>({
      name: 'settings',
      defaults,
    });
  }

  get(): SettingsSchema {
    return this.store.store;
  }

  set<K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]): void {
    this.store.set(key, value);
  }

  getAliases(): AliasMap {
    return this.store.get('aliases');
  }

  setAlias(key: string, value: string): void {
    const aliases = this.getAliases();
    aliases[key] = value;
    this.store.set('aliases', aliases);
  }

  removeAlias(key: string): void {
    const aliases = this.getAliases();
    delete aliases[key];
    this.store.set('aliases', aliases);
  }
}
```

---

## エラーハンドリング方針

### CLIが未インストールの場合

```typescript
import { which } from 'shelljs';

function checkCLIInstalled(cli: string): boolean {
  return !!which(cli);
}

// 使用例
if (!checkCLIInstalled('claude')) {
  return {
    success: false,
    error: 'CLI_NOT_INSTALLED',
    message: 'Claude CLIがインストールされていません。',
    hint: 'npm install -g @anthropic-ai/claude-cli でインストールしてください。',
  };
}
```

### 認証エラーの場合

```typescript
// stderrを監視して認証エラーを検出
runner.on('stderr', (data: string) => {
  if (data.includes('authentication') || data.includes('unauthorized')) {
    this.emit('auth-error', {
      cli,
      message: '認証が必要です。',
      hint: `${cli} login で認証してください。`,
    });
  }
});
```

### 一般的なエラー

```typescript
runner.on('error', (err: Error) => {
  // 人間向けのメッセージに変換
  const userMessage = translateError(err);
  
  this.emit('error', {
    original: err,
    message: userMessage,
  });
});

function translateError(err: Error): string {
  if (err.message.includes('ENOENT')) {
    return 'コマンドが見つかりません。';
  }
  if (err.message.includes('EACCES')) {
    return '実行権限がありません。';
  }
  return `エラーが発生しました: ${err.message}`;
}
```

---

## 禁止事項

1. **`eval()` の使用禁止** - セキュリティリスク
2. **未検証の入力をコマンドに渡さない** - コマンドインジェクション対策
3. **同期的なファイルI/O禁止** - UIフリーズ防止（`fs.readFileSync` → `fs.promises.readFile`）
4. **Renderer への直接 require 禁止** - contextIsolation 違反

---

## チェックリスト

新しいコードを追加する際は、以下を確認してください：

- [ ] IPCハンドラーは `ipc-handlers.ts` に集約されているか
- [ ] 非同期処理は適切に `async/await` または EventEmitter で実装されているか
- [ ] エラーは人間向けのメッセージに変換されているか
- [ ] 型定義は `app/shared/types/` を参照しているか
- [ ] `rm -rf` などの危険コマンドに対する警告は実装されているか（Phase 2）
