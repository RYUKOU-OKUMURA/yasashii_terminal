/**
 * 日本語コマンドプリセット定義
 *
 * ファイル操作、Git操作、AI CLIツール、システム操作の各カテゴリについて、
 * 日本語コマンドと実際のシェルコマンドのマッピングを定義する。
 */

/**
 * プリセットエイリアス定義
 */
export const PRESET_ALIASES = {
  // ファイル操作
  'ファイル一覧': 'ls -la',
  '隠しファイル含む一覧': 'ls -la',
  '今いる場所': 'pwd',
  '移動': 'cd',
  '戻る': 'cd ..',
  'ホームに戻る': 'cd ~',
  '作成': 'mkdir',
  'ファイル作成': 'touch',
  '削除': 'rm',
  'コピー': 'cp',
  '名前変更': 'mv',
  '中身を見る': 'cat',
  '検索': 'find . -name',

  // Git操作
  '状態': 'git status',
  '差分': 'git diff',
  '履歴': 'git log --oneline -20',
  '保存': 'git add . && git commit -m',
  '送信': 'git push',
  '取得': 'git pull',
  'ブランチ一覧': 'git branch -a',
  '切替': 'git checkout',

  // AI CLIツール
  'クロード': 'claude',
  'コーデックス': 'codex',
  'ジェミニ': 'gemini',

  // システム
  'クリア': 'clear',
  '終了': 'exit',
} as const;

/**
 * プリセットエイリアスキー型
 */
export type PresetAliasKey = keyof typeof PRESET_ALIASES;

/**
 * コマンドカテゴリ
 */
export type CommandCategory = 'file' | 'git' | 'ai' | 'system';

/**
 * エイリアスカテゴリマップ
 */
export const ALIAS_CATEGORIES: Record<PresetAliasKey, CommandCategory> = {
  // ファイル操作
  'ファイル一覧': 'file',
  '隠しファイル含む一覧': 'file',
  '今いる場所': 'file',
  '移動': 'file',
  '戻る': 'file',
  'ホームに戻る': 'file',
  '作成': 'file',
  'ファイル作成': 'file',
  '削除': 'file',
  'コピー': 'file',
  '名前変更': 'file',
  '中身を見る': 'file',
  '検索': 'file',

  // Git操作
  '状態': 'git',
  '差分': 'git',
  '履歴': 'git',
  '保存': 'git',
  '送信': 'git',
  '取得': 'git',
  'ブランチ一覧': 'git',
  '切替': 'git',

  // AI CLIツール
  'クロード': 'ai',
  'コーデックス': 'ai',
  'ジェミニ': 'ai',

  // システム
  'クリア': 'system',
  '終了': 'system',
};

/**
 * エイリアス説明（ヘルプ用）
 */
export const ALIAS_DESCRIPTIONS: Record<PresetAliasKey, string> = {
  // ファイル操作
  'ファイル一覧': 'カレントディレクトリのファイル一覧を表示します（隠しファイル含む）',
  '隠しファイル含む一覧': 'カレントディレクトリのファイル一覧を表示します（隠しファイル含む）',
  '今いる場所': '現在の作業ディレクトリのパスを表示します',
  '移動': '指定したディレクトリに移動します（例: 移動 /path/to/dir）',
  '戻る': '親ディレクトリに移動します',
  'ホームに戻る': 'ホームディレクトリに移動します',
  '作成': 'ディレクトリを作成します（例: 作成 dirname）',
  'ファイル作成': '空のファイルを作成します（例: ファイル作成 filename.txt）',
  '削除': 'ファイルまたはディレクトリを削除します',
  'コピー': 'ファイルをコピーします',
  '名前変更': 'ファイル名を変更します',
  '中身を見る': 'ファイルの内容を表示します',
  '検索': 'ファイルを検索します（例: 検索 filename）',

  // Git操作
  '状態': 'Gitリポジトリの状態を表示します',
  '差分': '変更点の差分を表示します',
  '履歴': 'コミット履歴を表示します',
  '保存': '変更をステージしてコミットします（例: 保存 "メッセージ"）',
  '送信': '変更をリモートリポジトリにプッシュします',
  '取得': 'リモートリポジトリから変更をプルします',
  'ブランチ一覧': '全てのブランチを表示します',
  '切替': '指定したブランチに切り替えます',

  // AI CLIツール
  'クロード': 'Claude Code CLIを起動します',
  'コーデックス': 'Codex CLIを起動します',
  'ジェミニ': 'Gemini CLIを起動します',

  // システム
  'クリア': '画面をクリアします',
  '終了': 'アプリケーションを終了します',
};

/**
 * 自然言語パターン（Phase 2向け）
 * 動的パターンマッチングのための定義
 */
export interface NaturalLanguagePattern {
  category: CommandCategory;
  patterns: RegExp[];
  template: string;
  description: string;
}

/**
 * 自然言語パターン定義（Phase 2）
 */
export const NATURAL_LANGUAGE_PATTERNS: NaturalLanguagePattern[] = [
  // 移動系
  {
    category: 'file',
    patterns: [
      /^(.+?)に移動$/,
      /^(.+?)へ移動$/,
      /^(.+?)フォルダに移動$/,
      /^(.+?)ディレクトリに移動$/,
    ],
    template: 'cd {path}',
    description: '指定した場所に移動します',
  },
  // 作成系
  {
    category: 'file',
    patterns: [
      /^(.+?)を作成$/,
      /^(.+?)フォルダを作成$/,
      /^(.+?)ディレクトリを作成$/,
    ],
    template: 'mkdir {name}',
    description: 'ディレクトリを作成します',
  },
  {
    category: 'file',
    patterns: [/^(.+?)ファイルを作成$/],
    template: 'touch {name}',
    description: 'ファイルを作成します',
  },
  // 削除系
  {
    category: 'file',
    patterns: [/^(.+?)を削除$/],
    template: 'rm {target}',
    description: 'ファイルを削除します',
  },
  // 表示系
  {
    category: 'file',
    patterns: [/^(.+?)の中身$/, /^(.+?)を表示$/],
    template: 'cat {file}',
    description: 'ファイルの内容を表示します',
  },
];
