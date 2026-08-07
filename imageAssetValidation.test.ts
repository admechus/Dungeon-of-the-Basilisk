import { describe, expect, it } from 'vitest';
import {
  createImageAssetMetadata,
  generateImageAssetId,
  MAX_IMAGE_FILE_SIZE_BYTES,
  renameImageAssetMetadata,
  sanitizeImageAssetName,
  validateImageAssetMetadata,
  validateImageAssetName,
} from './imageAssetValidation';

const createFileInfo = (overrides: Partial<{ name: string; type: string; size: number }> = {}) => ({
  name: 'lesson-image.png',
  type: 'image/png',
  size: 1024,
  ...overrides,
});

describe('validateImageAssetMetadata', () => {
  it('accepts a PNG within limits', () => {
    expect(validateImageAssetMetadata(createFileInfo({ type: 'image/png' }), { width: 800, height: 600 }).isValid).toBe(true);
  });

  it('accepts a JPEG within limits', () => {
    expect(validateImageAssetMetadata(createFileInfo({ type: 'image/jpeg' }), { width: 800, height: 600 }).isValid).toBe(true);
  });

  it('accepts a WebP within limits', () => {
    expect(validateImageAssetMetadata(createFileInfo({ type: 'image/webp' }), { width: 800, height: 600 }).isValid).toBe(true);
  });

  it('rejects an unsupported MIME type', () => {
    expect(validateImageAssetMetadata(createFileInfo({ type: 'image/gif' }), { width: 800, height: 600 }).isValid).toBe(false);
  });

  it('rejects a file larger than 2 MB', () => {
    expect(validateImageAssetMetadata(createFileInfo({ size: MAX_IMAGE_FILE_SIZE_BYTES + 1 }), { width: 800, height: 600 }).isValid).toBe(false);
  });

  it('rejects an image wider than 2048 pixels', () => {
    expect(validateImageAssetMetadata(createFileInfo(), { width: 2049, height: 600 }).isValid).toBe(false);
  });

  it('rejects an image taller than 2048 pixels', () => {
    expect(validateImageAssetMetadata(createFileInfo(), { width: 800, height: 2049 }).isValid).toBe(false);
  });
});

describe('image asset metadata helpers', () => {
  it('creates metadata from a valid image file', () => {
    expect(createImageAssetMetadata(
      createFileInfo({ name: '  map.webp  ', type: 'image/webp', size: 2048 }),
      { width: 320, height: 240 },
      '2026-07-18T00:00:00.000Z',
      'asset-id'
    )).toEqual({
      id: 'asset-id',
      name: 'map.webp',
      mimeType: 'image/webp',
      size: 2048,
      width: 320,
      height: 240,
      createdAt: '2026-07-18T00:00:00.000Z',
      updatedAt: '2026-07-18T00:00:00.000Z',
    });
  });

  it('generates a fallback id without randomUUID', () => {
    const id = generateImageAssetId(null);

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}$/);
  });

  it('renames without changing other metadata', () => {
    const metadata = createImageAssetMetadata(createFileInfo(), { width: 100, height: 100 }, 'created', 'id-1');

    expect(renameImageAssetMetadata(metadata, '  renamed.jpg  ', 'updated')).toEqual({
      ...metadata,
      name: 'renamed.jpg',
      updatedAt: 'updated',
    });
  });

  it('rejects an empty name', () => {
    expect(validateImageAssetName('   ').isValid).toBe(false);
  });

  it('trims whitespace from a name', () => {
    expect(sanitizeImageAssetName('  image.png  ')).toBe('image.png');
  });
});
