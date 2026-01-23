/**
 * AI CLI Runner - claude/codex/gemini CLIを実行する
 */
import { spawn } from 'node-pty';

export interface AICLIConfig {
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface AISession {
  pty: ReturnType<typeof spawn>;
  onData: (callback: (data: string) => void) => void;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  destroy: () => void;
}

/**
 * AI CLIプロセスを起動する
 */
export function spawnAICLI(config: AICLIConfig): AISession {
  const pty = spawn(config.command, config.args, {
    name: 'xterm-256color',
    cwd: config.cwd || process.cwd(),
    env: { ...process.env, ...config.env },
  });

  return {
    pty,
    onData: (callback: (data: string) => void) => {
      pty.onData((data) => {
        callback(data);
      });
    },
    write: (data: string) => {
      pty.write(data);
    },
    resize: (cols: number, rows: number) => {
      pty.resize(cols, rows);
    },
    destroy: () => {
      pty.kill();
    },
  };
}

/**
 * Claude Code CLI用の設定を生成
 */
export function getClaudeConfig(cwd?: string): AICLIConfig {
  return {
    command: 'claude',
    args: [],
    ...(cwd !== undefined && { cwd }),
  };
}

/**
 * Codex CLI用の設定を生成
 */
export function getCodexConfig(cwd?: string): AICLIConfig {
  return {
    command: 'codex',
    args: [],
    ...(cwd !== undefined && { cwd }),
  };
}

/**
 * Gemini CLI用の設定を生成
 */
export function getGeminiConfig(cwd?: string): AICLIConfig {
  return {
    command: 'gemini',
    args: [],
    ...(cwd !== undefined && { cwd }),
  };
}
