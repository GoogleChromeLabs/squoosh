/**
 * WordPress Integration Module for Squoosh
 * 
 * This module provides compression APIs specifically designed for WordPress plugins.
 * It allows seamless integration of Squoosh's image compression capabilities
 * into WordPress image processing workflows.
 */

export { compressImage, compressImageBatch } from './compression';
export { generateThumbnails } from './thumbnails';
export { batchProcessor } from './batch-processor';
export * from './types';
