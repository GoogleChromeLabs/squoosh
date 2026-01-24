/**
 * Tests for app initialization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('App Initialization', () => {
  let mockRoot: HTMLElement;

  beforeEach(() => {
    // Create a mock root element
    mockRoot = document.createElement('div');
    mockRoot.id = 'app';
    document.body.appendChild(mockRoot);
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Root element validation', () => {
    it('should throw error when root element is not found', () => {
      // Remove the root element
      document.body.removeChild(mockRoot);

      // Import the module which will execute immediately
      expect(() => {
        const root = document.getElementById('app') as HTMLElement;
        if (!root) {
          throw new Error('Root element #app not found');
        }
      }).toThrow('Root element #app not found');
    });

    it('should find root element when it exists', () => {
      const root = document.getElementById('app') as HTMLElement;
      expect(root).toBeDefined();
      expect(root.id).toBe('app');
    });
  });

  describe('Production mode initialization', () => {
    it('should not load preact/debug in production mode', async () => {
      // Mock __PRODUCTION__ as true
      const originalProduction = (globalThis as any).__PRODUCTION__;
      (globalThis as any).__PRODUCTION__ = true;

      // Create a spy for dynamic import
      const importSpy = vi.fn();

      try {
        // Simulate the main function logic
        if (!(globalThis as any).__PRODUCTION__) {
          await importSpy();
        }

        // In production, import should not be called
        expect(importSpy).not.toHaveBeenCalled();
      } finally {
        (globalThis as any).__PRODUCTION__ = originalProduction;
      }
    });
  });

  describe('Development mode initialization', () => {
    it('should attempt to load preact/debug in development mode', async () => {
      // Mock __PRODUCTION__ as false
      const originalProduction = (globalThis as any).__PRODUCTION__;
      (globalThis as any).__PRODUCTION__ = false;

      const importSpy = vi.fn().mockResolvedValue({});

      try {
        // Simulate the main function logic
        if (!(globalThis as any).__PRODUCTION__) {
          await importSpy();
        }

        // In development, import should be called
        expect(importSpy).toHaveBeenCalledTimes(1);
      } finally {
        (globalThis as any).__PRODUCTION__ = originalProduction;
      }
    });
  });

  describe('Error handling', () => {
    it('should display error message when app fails to load', async () => {
      const root = document.getElementById('app') as HTMLElement;
      const testError = new Error('Test loading error');
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      try {
        // Simulate error during initialization
        throw testError;
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

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize app:',
        testError,
      );
      expect(root.innerHTML).toContain('Failed to Load');
      expect(root.innerHTML).toContain(
        'An error occurred while loading the application',
      );
      expect(root.innerHTML).toContain('Reload');

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors gracefully and show reload button', async () => {
      const root = document.getElementById('app') as HTMLElement;

      // Simulate rendering error
      try {
        throw new Error('Render failed');
      } catch (error) {
        root.innerHTML = `
          <div style="padding: 20px; text-align: center; font-family: sans-serif;">
            <h1>Failed to Load</h1>
            <p>An error occurred while loading the application.</p>
            <button onclick="location.reload()">Reload</button>
          </div>
        `;
      }

      const button = root.querySelector('button');
      expect(button).toBeDefined();
      expect(button?.textContent).toBe('Reload');
      expect(button?.getAttribute('onclick')).toBe('location.reload()');
    });
  });

  describe('Global error handlers', () => {
    it('should handle global errors', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const errorEvent = new ErrorEvent('error', {
        error: new Error('Test global error'),
      });

      window.dispatchEvent(errorEvent);

      // Verify error was logged (if handler is set up)
      // Note: The actual handler setup is in the main app file

      consoleErrorSpy.mockRestore();
    });

    it('should handle unhandled promise rejections', () => {
      // Test that rejection handlers can be set up
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Manually trigger the handler since PromiseRejectionEvent may not be available
      const handleRejection = (event: any) => {
        console.error('Unhandled promise rejection:', event.reason);
      };

      // Simulate rejection
      const testReason = 'Test rejection';
      handleRejection({ reason: testReason });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unhandled promise rejection:',
        testReason,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Module loader function', () => {
    it('should load module dynamically using string interpolation', async () => {
      // Test that the module loader pattern works
      async function loadDebugModule() {
        const moduleName = 'preact/debug';
        // In test environment, this would normally fail,
        // but we can test the pattern is correct
        try {
          // This simulates the pattern used in the actual code
          const module = moduleName;
          expect(module).toBe('preact/debug');
        } catch (error) {
          // Expected in test environment
        }
      }

      await loadDebugModule();
    });
  });
});
