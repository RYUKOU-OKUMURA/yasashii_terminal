/**
 * Vite環境変数型定義
 */

declare const __MODE__: string;
declare const __DEV__: boolean;
declare const __PROD__: boolean;

interface ImportMetaEnv {
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
