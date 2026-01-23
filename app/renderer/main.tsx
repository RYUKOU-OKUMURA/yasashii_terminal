/**
 * Renderer Entry Point
 *
 * Reactアプリケーションのエントリーポイント。
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

console.log('[main.tsx] Starting...');
const container = document.getElementById('root');
console.log('[main.tsx] Root element:', container);

if (container === null) {
  console.error('[main.tsx] Root container not found!');
  throw new Error('Root container not found');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
