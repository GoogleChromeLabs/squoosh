/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { h, render } from 'preact';
import App from './App';

const root = document.getElementById('app') as HTMLElement;

if (!root) {
  throw new Error('Root element #app not found');
}

async function main() {
  try {
    if (!__PRODUCTION__) await import('preact/debug');
    render(<App />, root);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    root.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1>Failed to Load</h1>
        <p>An error occurred while loading the application.</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

main();

// Analytics
{
  // Determine the current display mode.
  const displayMode =
    (navigator as any).standalone ||
    window.matchMedia('(display-mode: standalone)').matches
      ? 'standalone'
      : 'browser';

  // Setup analytics
  (window as any).ga =
    (window as any).ga ||
    ((...args: any[]) =>
      ((window as any).ga.q = (window as any).ga.q || []).push(args));
  (window as any).ga('create', 'UA-128752250-1', 'auto');
  (window as any).ga('set', 'transport', 'beacon');
  (window as any).ga('set', 'dimension1', displayMode);
  (window as any).ga('send', 'pageview', '/index.html', { title: 'Squoosh' });
  // Load the GA script without keeping the browser spinner going.
  addEventListener('load', () => {
    const script = document.createElement('script');
    script.src = 'https://www.google-analytics.com/analytics.js';
    script.async = true;
    document.head.appendChild(script);
  });
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
