/**
 * WordPress Integration Module for Squoosh
 *
 * This module provides compression APIs specifically designed for WordPress plugins.
 * It allows seamless integration of Squoosh's image compression capabilities
 * into WordPress image processing workflows.
 *
 * NOTE: This is a PLACEHOLDER implementation. The actual compression logic needs
 * to be integrated with Squoosh's encoder APIs. This provides the interface structure
 * and types for WordPress plugin developers to start building against.
 */

export { compressImage, compressImageBatch } from './compression';
export { generateThumbnails } from './thumbnails';
export { batchProcessor } from './batch-processor';
export * from './types';
