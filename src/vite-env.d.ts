/// <reference types="vite/client" />

declare const __PRODUCTION__: boolean;
declare const __PRERENDER__: boolean;

interface Window {
  ga: any;
}

interface Navigator {
  readonly standalone?: boolean;
}
