import { LocalImageAssetMetadata } from './types';

export const SUPPORTED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_IMAGE_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION_PX = 2048;

export type SupportedImageMimeType = typeof SUPPORTED_IMAGE_MIME_TYPES[number];

export interface ImageAssetFileInfo {
  name: string;
  type: string;
  size: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageAssetValidationResult {
  isValid: boolean;
  errors: string[];
}

export const isSupportedImageMimeType = (mimeType: string): mimeType is SupportedImageMimeType =>
  SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType as SupportedImageMimeType);

export const sanitizeImageAssetName = (name: string): string =>
  name.trim();

export const validateImageAssetMetadata = (
  file: ImageAssetFileInfo,
  dimensions: ImageDimensions
): ImageAssetValidationResult => {
  const errors: string[] = [];

  if (!isSupportedImageMimeType(file.type)) {
    errors.push('Unsupported image format. Use PNG, JPEG, or WebP.');
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    errors.push('Image file is larger than 2 MB.');
  }

  if (dimensions.width <= 0 || dimensions.height <= 0) {
    errors.push('Image dimensions could not be read.');
  }

  if (dimensions.width > MAX_IMAGE_DIMENSION_PX) {
    errors.push('Image width is larger than 2048 pixels.');
  }

  if (dimensions.height > MAX_IMAGE_DIMENSION_PX) {
    errors.push('Image height is larger than 2048 pixels.');
  }

  if (!sanitizeImageAssetName(file.name)) {
    errors.push('Image name is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const generateImageAssetId = (cryptoSource: Crypto | null = globalThis.crypto): string => {
  if (cryptoSource && typeof cryptoSource.randomUUID === 'function') {
    return cryptoSource.randomUUID();
  }

  const randomValues = new Uint32Array(4);
  if (cryptoSource && typeof cryptoSource.getRandomValues === 'function') {
    cryptoSource.getRandomValues(randomValues);
  } else {
    randomValues.forEach((_, index) => {
      randomValues[index] = Math.floor(Math.random() * 0xffffffff);
    });
  }

  return Array.from(randomValues, (value) => value.toString(16).padStart(8, '0')).join('-');
};

export const createImageAssetMetadata = (
  file: ImageAssetFileInfo,
  dimensions: ImageDimensions,
  now: string = new Date().toISOString(),
  id: string = generateImageAssetId()
): LocalImageAssetMetadata => ({
  id,
  name: sanitizeImageAssetName(file.name),
  mimeType: file.type,
  size: file.size,
  width: dimensions.width,
  height: dimensions.height,
  createdAt: now,
  updatedAt: now,
});

export const renameImageAssetMetadata = (
  metadata: LocalImageAssetMetadata,
  nextName: string,
  updatedAt: string = new Date().toISOString()
): LocalImageAssetMetadata => ({
  ...metadata,
  name: sanitizeImageAssetName(nextName),
  updatedAt,
});

export const validateImageAssetName = (name: string): ImageAssetValidationResult => {
  const errors = sanitizeImageAssetName(name) ? [] : ['Image name is required.'];
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getImageFileDimensions = async (file: Blob): Promise<ImageDimensions> => {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    const dimensions = {
      width: bitmap.width,
      height: bitmap.height,
    };
    bitmap.close();
    return dimensions;
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image file could not be decoded.'));
    };
    image.src = url;
  });
};

export const validateImageFile = async (file: File): Promise<ImageAssetValidationResult & { dimensions?: ImageDimensions }> => {
  if (!isSupportedImageMimeType(file.type) || file.size > MAX_IMAGE_FILE_SIZE_BYTES || !sanitizeImageAssetName(file.name)) {
    return validateImageAssetMetadata(file, { width: 1, height: 1 });
  }

  try {
    const dimensions = await getImageFileDimensions(file);
    const result = validateImageAssetMetadata(file, dimensions);
    return {
      ...result,
      dimensions,
    };
  } catch {
    return {
      isValid: false,
      errors: ['Image file is corrupted or cannot be decoded.'],
    };
  }
};
