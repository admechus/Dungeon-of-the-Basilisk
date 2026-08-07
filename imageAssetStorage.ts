import { LocalImageAsset, LocalImageAssetMetadata } from './types';
import {
  createImageAssetMetadata,
  renameImageAssetMetadata,
  validateImageAssetName,
  validateImageFile,
} from './imageAssetValidation';

export const IMAGE_ASSET_DB_NAME = 'dungeon-of-the-basilisk-content';
export const IMAGE_ASSET_DB_VERSION = 1;
export const IMAGE_ASSET_STORE_NAME = 'images';

type ImageAssetStoreMode = 'readonly' | 'readwrite';

const isIndexedDbAvailable = (): boolean =>
  typeof indexedDB !== 'undefined';

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
  });

const openImageAssetDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = indexedDB.open(IMAGE_ASSET_DB_NAME, IMAGE_ASSET_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_ASSET_STORE_NAME)) {
        database.createObjectStore(IMAGE_ASSET_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open image asset database.'));
  });

const withStore = async <T>(
  mode: ImageAssetStoreMode,
  action: (store: IDBObjectStore) => Promise<T>
): Promise<T> => {
  const database = await openImageAssetDatabase();

  try {
    const transaction = database.transaction(IMAGE_ASSET_STORE_NAME, mode);
    const store = transaction.objectStore(IMAGE_ASSET_STORE_NAME);
    const result = await action(store);
    await transactionDone(transaction);
    return result;
  } finally {
    database.close();
  }
};

export const listImageAssetMetadata = async (): Promise<LocalImageAssetMetadata[]> => {
  const assets = await withStore('readonly', (store) => requestToPromise<LocalImageAsset[]>(store.getAll()));
  return assets
    .map(({ blob: _blob, ...metadata }) => metadata)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getImageAsset = (id: string): Promise<LocalImageAsset | undefined> =>
  withStore('readonly', (store) => requestToPromise<LocalImageAsset | undefined>(store.get(id)));

export const hasImageAsset = async (id: string): Promise<boolean> => {
  const key = await withStore('readonly', (store) => requestToPromise<IDBValidKey | undefined>(store.getKey(id)));
  return key !== undefined;
};

export const addImageAsset = async (file: File): Promise<LocalImageAsset> => {
  const validation = await validateImageFile(file);
  if (!validation.isValid || !validation.dimensions) {
    throw new Error(validation.errors.join(' '));
  }

  const metadata = createImageAssetMetadata(file, validation.dimensions);
  const asset: LocalImageAsset = {
    ...metadata,
    blob: file,
  };

  await withStore('readwrite', async (store) => {
    await requestToPromise<IDBValidKey>(store.add(asset));
  });

  return asset;
};

export const renameImageAsset = async (id: string, nextName: string): Promise<LocalImageAsset> => {
  const validation = validateImageAssetName(nextName);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  return withStore('readwrite', async (store) => {
    const asset = await requestToPromise<LocalImageAsset | undefined>(store.get(id));
    if (!asset) {
      throw new Error('Image asset was not found.');
    }

    const renamedAsset: LocalImageAsset = {
      ...asset,
      ...renameImageAssetMetadata(asset, nextName),
      blob: asset.blob,
    };
    await requestToPromise<IDBValidKey>(store.put(renamedAsset));
    return renamedAsset;
  });
};

export const deleteImageAsset = (id: string): Promise<void> =>
  withStore('readwrite', async (store) => {
    await requestToPromise<undefined>(store.delete(id));
  });

export const clearImageAssets = (): Promise<void> =>
  withStore('readwrite', async (store) => {
    await requestToPromise<undefined>(store.clear());
  });
