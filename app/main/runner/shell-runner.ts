/**
 * Shell Runner - シェルコマンドを実行する
 */
import { spawn } from 'node-pty';

export interface ShellConfig {
  shell?: string;
  cwd?: string;
  env?: Record<string, string>;
}

export interface ShellSession {
  pty: ReturnType<typeof spawn>;
  onData: (callback: (data: string) => void) => void;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  destroy: () => void;
}

/**
 * シェルセッションを起動する
 */
export function spawnShell(config: ShellConfig = {}): ShellSession {
  const shell = config.shell || process.env.SHELL || 'bash';

  const pty = spawn(shell, [], {
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
 * 単発のコマンドを実行する（Promiseベース）
 */
export function executeCommand(
  command: string,
  args: string[],
  options: { cwd?: string; timeout?: number } = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const pty = spawn(command, args, {
      name: 'xterm-256color',
      cwd: options.cwd || process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    pty.onData((data) => {
      stdout += data;
    });

    pty.onExit(({ exitCode }) => {
      resolve({ stdout, stderr, exitCode: exitCode ?? 0 });
    });

    if (options.timeout) {
      setTimeout(() => {
        pty.kill();
        reject(new Error(`Command timeout after ${options.timeout}ms`));
      }, options.timeout);
    }
  });
}
