export interface Ben2CacheLifecycleCallbacks {
  isEnabled(): boolean;
  readCached(): Promise<boolean>;
  download(): Promise<void>;
  setCached(cached: boolean): void;
  setDownloading(downloading: boolean): void;
}

interface Ben2EventTarget {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface Ben2CacheLifecycleEnvironment {
  window: Ben2EventTarget;
  document: Ben2EventTarget & { visibilityState: string };
  serviceWorker: Ben2EventTarget;
  setInterval(callback: () => void, delay: number): number;
  clearInterval(id: number): void;
}

function browserEnvironment(): Ben2CacheLifecycleEnvironment {
  return {
    window,
    document,
    serviceWorker: navigator.serviceWorker,
    setInterval: (callback, delay) => window.setInterval(callback, delay),
    clearInterval: (id) => window.clearInterval(id),
  };
}

/** Owns Compress's one shared BEN2 status/download event lifecycle. */
export class Ben2CacheLifecycle {
  private statusRefresh?: Promise<boolean>;
  private downloadWork?: Promise<void>;
  private poll?: number;
  private mounted = false;
  private disposed = false;

  constructor(
    private readonly callbacks: Ben2CacheLifecycleCallbacks,
    private readonly environment: Ben2CacheLifecycleEnvironment = browserEnvironment(),
  ) {}

  private readonly onControllerChange = (): void => {
    void this.refresh();
  };

  private readonly onFocus = (): void => {
    void this.refresh();
  };

  private readonly onVisibilityChange = (): void => {
    if (this.environment.document.visibilityState === 'visible') {
      void this.refresh();
    }
  };

  mount(): void {
    if (this.mounted || this.disposed) return;
    this.mounted = true;
    this.environment.serviceWorker.addEventListener(
      'controllerchange',
      this.onControllerChange,
    );
    this.environment.window.addEventListener('focus', this.onFocus);
    this.environment.document.addEventListener(
      'visibilitychange',
      this.onVisibilityChange,
    );
    this.updatePolling();
    void this.refresh();
  }

  refresh = (): Promise<boolean> => {
    if (this.disposed) return Promise.resolve(false);
    if (!this.statusRefresh) {
      const tracked = this.callbacks
        .readCached()
        .catch(() => false)
        .then((cached) => {
          if (!this.disposed) this.callbacks.setCached(cached);
          return cached;
        })
        .finally(() => {
          if (this.statusRefresh === tracked) this.statusRefresh = undefined;
        });
      this.statusRefresh = tracked;
    }
    return this.statusRefresh;
  };

  updatePolling(): void {
    if (this.disposed) return;
    const enabled = this.callbacks.isEnabled();
    if (enabled && this.poll === undefined) {
      this.poll = this.environment.setInterval(
        () => void this.refresh(),
        2_000,
      );
    } else if (!enabled && this.poll !== undefined) {
      this.environment.clearInterval(this.poll);
      this.poll = undefined;
    }
  }

  download = (): Promise<void> => {
    if (this.disposed) return Promise.resolve();
    if (!this.downloadWork) {
      this.callbacks.setDownloading(true);
      const tracked = (async () => {
        try {
          await this.callbacks.download();
        } finally {
          await this.statusRefresh;
          await this.refresh();
          if (!this.disposed) this.callbacks.setDownloading(false);
        }
      })()
        .catch(() => undefined)
        .finally(() => {
          if (this.downloadWork === tracked) this.downloadWork = undefined;
        });
      this.downloadWork = tracked;
    }
    return this.downloadWork;
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.mounted) {
      this.environment.serviceWorker.removeEventListener(
        'controllerchange',
        this.onControllerChange,
      );
      this.environment.window.removeEventListener('focus', this.onFocus);
      this.environment.document.removeEventListener(
        'visibilitychange',
        this.onVisibilityChange,
      );
    }
    if (this.poll !== undefined) {
      this.environment.clearInterval(this.poll);
      this.poll = undefined;
    }
  }
}
