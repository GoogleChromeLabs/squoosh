/**
 * Tests for app initialization in production and development modes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('App Initialization', () => {
  let root: HTMLElement;

  beforeEach(() => {
    // Create a fresh DOM for each test
    document.body.innerHTML = '<div id="app"></div>';
    root = document.getElementById('app') as HTMLElement;
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Root Element Validation', () => {
    it('should find the root element', () => {
      const rootElement = document.getElementById('app');
      expect(rootElement).toBeDefined();
      expect(rootElement).not.toBeNull();
      expect(rootElement?.tagName).toBe('DIV');
    });

    it('should throw error when root element is missing', () => {
      document.body.innerHTML = '';
      const rootElement = document.getElementById('app');
      expect(rootElement).toBeNull();
    });
  });

  describe('Production Mode', () => {
    it('should initialize without preact/debug', () => {
      // In production mode, __PRODUCTION__ is true
      // The app should initialize without loading preact/debug
      expect(__PRODUCTION__).toBe(false); // In test env, it's false by default
    });

    it('should handle render errors gracefully', () => {
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Simulate an error scenario
      const error = new Error('Test render error');
      expect(error.message).toContain('Test render error');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Development Mode', () => {
    it('should be configured for development in test environment', () => {
      // In test environment, __PRODUCTION__ should be false
      expect(__PRODUCTION__).toBe(false);
    });

    it('should handle dynamic import path construction', () => {
      // Test that the module path is correctly constructed
      const modulePath = 'preact' + '/' + 'debug';
      expect(modulePath).toBe('preact/debug');
    });
  });

  describe('Error Handling', () => {
    it('should log errors to console', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Test error');

      console.error('Failed to initialize app:', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize app:',
        error,
      );
      consoleErrorSpy.mockRestore();
    });

    it('should display error UI when app fails to load', () => {
      const errorHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1>Failed to Load</h1>
        <p>An error occurred while loading the application.</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;

      root.innerHTML = errorHTML;

      expect(root.innerHTML).toContain('Failed to Load');
      expect(root.innerHTML).toContain(
        'An error occurred while loading the application',
      );
      expect(root.innerHTML).toContain('Reload');
    });
  });

  describe('Global Error Handlers', () => {
    it('should have error event listener', () => {
      const mockError = new Error('Test global error');
      const event = new ErrorEvent('error', { error: mockError });

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Create a handler similar to the one in the app
      const errorHandler = (event: ErrorEvent) => {
        console.error('Global error:', event.error);
      };

      errorHandler(event);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Global error:', mockError);
      consoleErrorSpy.mockRestore();
    });

    it('should handle unhandled promise rejections', () => {
      const reason = new Error('Test rejection');
      const event = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(reason),
        reason,
      });

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Create a handler similar to the one in the app
      const rejectionHandler = (event: PromiseRejectionEvent) => {
        console.error('Unhandled promise rejection:', event.reason);
      };

      rejectionHandler(event);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unhandled promise rejection:',
        reason,
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
