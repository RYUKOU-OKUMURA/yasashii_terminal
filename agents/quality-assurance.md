# テスト・品質管理 サブエージェント

このファイルはテストコードと品質管理を担当するサブエージェントの定義です。

## 担当範囲

- テストファイル全般
- Vitest ユニットテスト
- Playwright E2Eテスト
- Biome lint/format設定
- コードカバレッジ管理

---

## ファイル構成

```
yasashii_terminal/
├── tests/
│   ├── unit/
│   │   ├── main/
│   │   │   ├── command-parser.test.ts
│   │   │   ├── alias-resolver.test.ts
│   │   │   ├── ai-runner.test.ts
│   │   │   └── settings-store.test.ts
│   │   ├── renderer/
│   │   │   ├── components/
│   │   │   │   ├── Editor.test.tsx
│   │   │   │   ├── Output.test.tsx
│   │   │   │   └── CommandBar.test.tsx
│   │   │   └── stores/
│   │   │       └── editor-store.test.ts
│   │   └── shared/
│   │       └── types.test.ts
│   ├── e2e/
│   │   ├── app.spec.ts              # 基本動作テスト
│   │   ├── editor.spec.ts           # エディタ操作テスト
│   │   ├── command-execution.spec.ts # コマンド実行テスト
│   │   └── settings.spec.ts         # 設定画面テスト
│   ├── fixtures/
│   │   ├── mock-cli-responses.ts
│   │   └── test-aliases.json
│   └── helpers/
│       ├── ipc-mock.ts
│       └── test-utils.ts
├── vitest.config.ts
├── playwright.config.ts
└── biome.json
```

---

## Vitest 設定（vitest.config.ts）

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/helpers/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,tsx}'],
      exclude: [
        'app/**/*.d.ts',
        'app/**/index.ts',
        'app/**/*.test.{ts,tsx}',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '@shared': path.resolve(__dirname, './app/shared'),
    },
  },
});
```

---

## ユニットテスト実装パターン

### コマンドパーサーテスト（command-parser.test.ts）

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AliasResolver } from '@/main/command-parser/alias-resolver';

describe('AliasResolver', () => {
  let resolver: AliasResolver;

  beforeEach(() => {
    resolver = new AliasResolver();
  });

  describe('resolve', () => {
    it('日本語コマンドを正しく解決する', () => {
      expect(resolver.resolve('ファイル一覧')).toBe('ls -la');
    });

    it('引数付きコマンドを解決する', () => {
      expect(resolver.resolve('移動 src')).toBe('cd src');
    });

    it('未知のコマンドはそのまま返す', () => {
      expect(resolver.resolve('unknown')).toBe('unknown');
    });

    it('全角スペースを正規化する', () => {
      expect(resolver.resolve('移動　src')).toBe('cd src');
    });

    it('前後の空白を除去する', () => {
      expect(resolver.resolve('  ファイル一覧  ')).toBe('ls -la');
    });
  });

  describe('getSuggestions', () => {
    it('部分一致で候補を返す', () => {
      const suggestions = resolver.getSuggestions('ファイル');
      expect(suggestions).toContainEqual({
        key: 'ファイル一覧',
        value: 'ls -la',
      });
    });

    it('最大10件まで返す', () => {
      const suggestions = resolver.getSuggestions('');
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });
  });

  describe('addAlias', () => {
    it('カスタムエイリアスを追加できる', () => {
      resolver.addAlias('テスト', 'echo test');
      expect(resolver.resolve('テスト')).toBe('echo test');
    });
  });
});
```

### AIランナーテスト（ai-runner.test.ts）

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIRunner } from '@/main/runner/ai-runner';
import { spawn } from 'child_process';

// child_processをモック
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('AIRunner', () => {
  let runner: AIRunner;
  let mockProcess: any;

  beforeEach(() => {
    runner = new AIRunner();
    
    // モックプロセスの設定
    mockProcess = {
      stdin: { write: vi.fn(), end: vi.fn() },
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    };
    
    vi.mocked(spawn).mockReturnValue(mockProcess as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('CLIを起動してstdinにプロンプトを送信する', async () => {
      await runner.execute('claude', 'Hello');

      expect(spawn).toHaveBeenCalledWith('claude', [], expect.any(Object));
      expect(mockProcess.stdin.write).toHaveBeenCalledWith('Hello');
      expect(mockProcess.stdin.end).toHaveBeenCalled();
    });

    it('stdoutイベントを発火する', async () => {
      const onStdout = vi.fn();
      runner.on('stdout', onStdout);

      await runner.execute('claude', 'Hello');

      // stdoutハンドラーを取得して実行
      const stdoutHandler = mockProcess.stdout.on.mock.calls.find(
        (call: any[]) => call[0] === 'data'
      )?.[1];
      
      stdoutHandler?.(Buffer.from('Response'));
      expect(onStdout).toHaveBeenCalledWith('Response');
    });
  });

  describe('abort', () => {
    it('実行中のプロセスを終了する', async () => {
      await runner.execute('claude', 'Hello');
      runner.abort();

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGINT');
    });
  });
});
```

### Reactコンポーネントテスト（CommandBar.test.tsx）

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandBar } from '@/renderer/components/CommandBar';

// IPCをモック
const mockInvoke = vi.fn();
const mockSend = vi.fn();

vi.mock('@/renderer/hooks/useIPC', () => ({
  useIPC: () => ({
    invoke: mockInvoke,
    send: mockSend,
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

describe('CommandBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue('');
  });

  it('入力フィールドが表示される', () => {
    render(<CommandBar />);
    expect(screen.getByPlaceholderText(/日本語コマンド/)).toBeInTheDocument();
  });

  it('入力時にプレビューを取得する', async () => {
    mockInvoke.mockImplementation((channel) => {
      if (channel === 'command:preview') return Promise.resolve('ls -la');
      if (channel === 'command:suggestions') return Promise.resolve([]);
      return Promise.resolve('');
    });

    render(<CommandBar />);
    const input = screen.getByPlaceholderText(/日本語コマンド/);
    
    await userEvent.type(input, 'ファイル一覧');

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('command:preview', 'ファイル一覧');
    });
  });

  it('Enterキーでコマンドを実行する', async () => {
    mockInvoke.mockResolvedValue('ls -la');

    render(<CommandBar />);
    const input = screen.getByPlaceholderText(/日本語コマンド/);
    
    await userEvent.type(input, 'ファイル一覧{Enter}');

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith('terminal:execute', 'ls -la');
    });
  });

  it('実行ボタンをクリックでコマンドを実行する', async () => {
    mockInvoke.mockResolvedValue('pwd');

    render(<CommandBar />);
    const input = screen.getByPlaceholderText(/日本語コマンド/);
    
    await userEvent.type(input, '今いる場所');
    await userEvent.click(screen.getByText('実行'));

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith('terminal:execute', 'pwd');
    });
  });
});
```

### Zustandストアテスト（editor-store.test.ts）

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '@/renderer/stores/editor-store';

describe('useEditorStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useEditorStore.setState({ content: '' });
  });

  it('初期状態は空文字', () => {
    const { content } = useEditorStore.getState();
    expect(content).toBe('');
  });

  it('setContentで内容を更新できる', () => {
    useEditorStore.getState().setContent('Hello World');
    expect(useEditorStore.getState().content).toBe('Hello World');
  });

  it('clearで内容をクリアできる', () => {
    useEditorStore.getState().setContent('Hello');
    useEditorStore.getState().clear();
    expect(useEditorStore.getState().content).toBe('');
  });
});
```

---

## Playwright E2Eテスト設定（playwright.config.ts）

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'electron',
      testMatch: '**/*.spec.ts',
    },
  ],
});
```

### E2Eテスト実装（app.spec.ts）

```typescript
import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: [path.join(__dirname, '../../dist/main/main.js')],
  });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('アプリケーション基本動作', () => {
  test('アプリが起動する', async () => {
    const title = await page.title();
    expect(title).toBe('やさしいターミナル');
  });

  test('3ペインレイアウトが表示される', async () => {
    await expect(page.locator('[data-testid="output-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="commandbar-pane"]')).toBeVisible();
  });
});

test.describe('エディタ操作', () => {
  test('Enterで改行できる', async () => {
    const editor = page.locator('.monaco-editor textarea');
    await editor.fill('Line 1');
    await editor.press('Enter');
    await editor.type('Line 2');

    const content = await page.evaluate(() => {
      // Monaco Editorの内容を取得
      return (window as any).monacoEditor?.getValue();
    });

    expect(content).toContain('Line 1\nLine 2');
  });

  test('Cmd+Enterで送信される', async () => {
    const editor = page.locator('.monaco-editor textarea');
    await editor.fill('echo hello');
    
    await editor.press('Meta+Enter');

    // 出力ペインにコマンドが表示されることを確認
    await expect(page.locator('[data-testid="output-pane"]')).toContainText('hello');
  });
});
```

### コマンド実行テスト（command-execution.spec.ts）

```typescript
import { test, expect } from '@playwright/test';

test.describe('コマンド実行', () => {
  test('日本語コマンドが実行される', async ({ page }) => {
    const commandBar = page.locator('[data-testid="command-input"]');
    await commandBar.fill('今いる場所');
    await commandBar.press('Enter');

    // pwdの出力が表示される
    await expect(page.locator('[data-testid="output-pane"]')).toContainText('/');
  });

  test('コマンドプレビューが表示される', async ({ page }) => {
    const commandBar = page.locator('[data-testid="command-input"]');
    await commandBar.fill('ファイル一覧');

    // プレビューにls -laが表示される
    await expect(page.locator('[data-testid="command-preview"]')).toContainText('ls -la');
  });

  test('補完候補が表示される', async ({ page }) => {
    const commandBar = page.locator('[data-testid="command-input"]');
    await commandBar.fill('ファイル');

    // 補完候補が表示される
    await expect(page.locator('[data-testid="suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="suggestions"]')).toContainText('ファイル一覧');
  });
});
```

---

## Biome設定（biome.json）

```json
{
  "$schema": "https://biomejs.dev/schemas/1.4.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noForEach": "warn",
        "useSimplifiedLogicExpression": "warn"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error",
        "useTemplate": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog": "warn"
      },
      "a11y": {
        "useKeyWithClickEvents": "warn"
      }
    },
    "ignore": [
      "node_modules",
      "dist",
      "coverage"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingComma": "es5"
    }
  }
}
```

---

## モック・ヘルパー

### IPCモック（ipc-mock.ts）

```typescript
import { vi } from 'vitest';

export function createIPCMock() {
  const handlers = new Map<string, Function>();

  return {
    invoke: vi.fn((channel: string, ...args: unknown[]) => {
      const handler = handlers.get(`invoke:${channel}`);
      return handler ? handler(...args) : Promise.resolve(undefined);
    }),
    send: vi.fn(),
    on: vi.fn((channel: string, callback: Function) => {
      handlers.set(`on:${channel}`, callback);
    }),
    off: vi.fn(),

    // テスト用ヘルパー
    mockInvokeHandler(channel: string, handler: Function) {
      handlers.set(`invoke:${channel}`, handler);
    },
    triggerEvent(channel: string, data: unknown) {
      const handler = handlers.get(`on:${channel}`);
      handler?.(data);
    },
    reset() {
      handlers.clear();
      this.invoke.mockClear();
      this.send.mockClear();
    },
  };
}
```

### テストユーティリティ（test-utils.ts）

```typescript
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

// カスタムレンダー（Providerラップなど）
export function renderWithProviders(ui: ReactElement) {
  return render(ui);
}

// 非同期待機ヘルパー
export function waitForMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// モックCLIレスポンス生成
export function createMockCLIResponse(content: string, delay = 0): string[] {
  // ストリーミング風にチャンク分割
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += 10) {
    chunks.push(content.slice(i, i + 10));
  }
  return chunks;
}
```

---

## カバレッジ目標

| カテゴリ | 目標 | 優先度 |
|---------|------|--------|
| コマンドパーサー | 90% | 高 |
| ランナー | 80% | 高 |
| 設定ストア | 85% | 中 |
| Reactコンポーネント | 70% | 中 |
| E2Eシナリオ | 主要フロー網羅 | 高 |

---

## E2Eシナリオ一覧

### 必須シナリオ（MVP）

1. **アプリ起動** - 3ペインが表示される
2. **エディタ入力** - Enter で改行、Cmd+Enter で送信
3. **日本語コマンド** - 「ファイル一覧」→ `ls -la` 実行
4. **コマンドプレビュー** - 入力中に変換結果が表示
5. **出力表示** - コマンド結果がストリーミング表示

### 追加シナリオ（Phase 2）

6. **設定変更** - エイリアス追加が反映される
7. **履歴検索** - 過去のコマンドを検索できる
8. **危険コマンド警告** - `rm -rf` で確認ダイアログ

---

## 禁止事項

1. **本番コードにテストコードを混在させない**
2. **モックの過剰使用** - 可能な限り実際の実装をテスト
3. **非決定的なテスト** - ランダムやタイミング依存を避ける
4. **console.log をテストに残さない**

---

## チェックリスト

テストを追加する際は、以下を確認してください：

- [ ] `tests/unit/` または `tests/e2e/` に配置されているか
- [ ] 命名が `*.test.ts` または `*.spec.ts` か
- [ ] モックは `beforeEach` でリセットされているか
- [ ] 非同期処理は `await` されているか
- [ ] エッジケース（空文字、null、エラー）をテストしているか
- [ ] CI で実行可能か（環境依存がないか）
