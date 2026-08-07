import React, { useEffect, useRef, useState } from 'react';
import {
  addImageAsset,
  clearImageAssets,
  deleteImageAsset,
  getImageAsset,
  listImageAssetMetadata,
  renameImageAsset,
} from '../imageAssetStorage';
import { MAX_IMAGE_DIMENSION_PX, MAX_IMAGE_FILE_SIZE_BYTES, SUPPORTED_IMAGE_MIME_TYPES } from '../imageAssetValidation';
import { Language, LocalImageAsset, LocalImageAssetMetadata } from '../types';
import { formatTeacherText, localizeTeacherEditorMessage, TeacherEditorText } from '../teacherEditorUi';
import ImageAssetPreview from './ImageAssetPreview';

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

interface ImageAssetLibraryProps {
  language: Language;
  text: TeacherEditorText;
}

const ImageAssetLibrary: React.FC<ImageAssetLibraryProps> = ({ language, text }) => {
  const [assets, setAssets] = useState<LocalImageAssetMetadata[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<LocalImageAsset | null>(null);
  const [selectedObjectUrl, setSelectedObjectUrl] = useState<string | null>(null);
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = async () => {
    try {
      setIsBusy(true);
      const nextAssets = await listImageAssetMetadata();
      setAssets(nextAssets);
      setIsUnavailable(false);
      setErrorText('');
    } catch (error) {
      setIsUnavailable(true);
      setErrorText(error instanceof Error ? error.message : text.imageLibraryUnavailable);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    void loadAssets();
  }, []);

  useEffect(() => {
    if (!selectedAsset) {
      setSelectedObjectUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedAsset.blob);
    setSelectedObjectUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedAsset]);

  const uploadFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    let uploadedCount = 0;
    const errors: string[] = [];
    setIsBusy(true);

    for (const file of fileArray) {
      try {
        await addImageAsset(file);
        uploadedCount += 1;
      } catch (error) {
        const message = error instanceof Error ? localizeTeacherEditorMessage(error.message, language) : text.imageSaveFailed;
        errors.push(`${file.name}: ${message}`);
      }
    }

    await loadAssets();
    setStatusText(uploadedCount > 0 ? text.imagesUploaded.replace('{count}', String(uploadedCount)) : '');
    setErrorText(errors.join(' '));
    setIsBusy(false);
  };

  const renameAsset = async (asset: LocalImageAssetMetadata) => {
    try {
      const nextName = renameDrafts[asset.id] ?? asset.name;
      await renameImageAsset(asset.id, nextName);
      await loadAssets();
      setRenameDrafts((current) => {
        const { [asset.id]: _removed, ...nextDrafts } = current;
        return nextDrafts;
      });
      setStatusText(text.imageRenamed);
      setErrorText('');
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : text.imageLibraryUnavailable);
    }
  };

  const deleteAsset = async (asset: LocalImageAssetMetadata) => {
    if (!window.confirm(text.confirmDeleteImage)) return;

    try {
      await deleteImageAsset(asset.id);
      if (selectedAsset?.id === asset.id) setSelectedAsset(null);
      await loadAssets();
      setStatusText(text.imageDeleted);
      setErrorText('');
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : text.imageLibraryUnavailable);
    }
  };

  const clearLibrary = async () => {
    if (!window.confirm(text.confirmClearImages)) return;

    try {
      await clearImageAssets();
      setSelectedAsset(null);
      await loadAssets();
      setStatusText(text.imagesCleared);
      setErrorText('');
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : text.imageLibraryUnavailable);
    }
  };

  const openPreview = async (assetId: string) => {
    try {
      const asset = await getImageAsset(assetId);
      if (!asset) {
        setErrorText(text.missingImage);
        return;
      }
      setSelectedAsset(asset);
      setErrorText('');
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : text.imageLibraryUnavailable);
    }
  };

  return (
    <section className="border border-stone-800 bg-black/40 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl dungeon-font text-amber-500">{text.imagesTab}</h2>
          <p className="text-xs text-stone-500 mt-1">
            {formatTeacherText(text.imageRequirements, {
              size: formatBytes(MAX_IMAGE_FILE_SIZE_BYTES),
              dimension: MAX_IMAGE_DIMENSION_PX,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => fileInputRef.current?.click()} disabled={isBusy || isUnavailable} className="vn-button px-3 py-2 text-xs">{text.uploadImages}</button>
          <button onClick={() => void loadAssets()} disabled={isBusy} className="vn-button px-3 py-2 text-xs">{text.refresh}</button>
          <button onClick={clearLibrary} disabled={isBusy || assets.length === 0} className="vn-button px-3 py-2 text-xs">{text.clearLibrary}</button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={SUPPORTED_IMAGE_MIME_TYPES.join(',')}
            className="hidden"
            onChange={(event) => {
              const files = event.currentTarget.files;
              if (files) void uploadFiles(files);
              event.currentTarget.value = '';
            }}
          />
        </div>
      </div>

      {isUnavailable && <p className="text-sm text-red-300 border border-red-900/60 bg-red-950/30 p-3 mb-4">{text.imageLibraryUnavailable}</p>}
      {errorText && <p className="text-sm text-red-300 border border-red-900/60 bg-red-950/30 p-3 mb-4">{errorText}</p>}
      {statusText && <p className="text-sm text-amber-300 border border-amber-900/50 bg-amber-950/20 p-3 mb-4">{statusText}</p>}

      {assets.length === 0 ? (
        <p className="text-sm text-stone-500 border border-stone-800 p-4">{text.imageLibraryEmpty}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {assets.map((asset) => (
            <article key={asset.id} className="border border-stone-800 bg-stone-950/70 p-3">
              <button onClick={() => void openPreview(asset.id)} className="block w-full text-left">
                <ImageAssetPreview assetId={asset.id} alt={asset.name} className="w-full aspect-video object-cover border border-stone-800 bg-stone-900" missingLabel={text.imageUnavailable} loadingLabel={text.loadingImage} />
              </button>
              <div className="mt-3 space-y-1">
                <h3 className="font-serif text-stone-200 break-words">{asset.name}</h3>
                <p className="text-xs text-stone-500">{asset.mimeType} - {formatBytes(asset.size)}</p>
                <p className="text-xs text-stone-500">{asset.width} x {asset.height}px</p>
              </div>
              <input
                value={renameDrafts[asset.id] ?? asset.name}
                onChange={(event) => setRenameDrafts((current) => ({ ...current, [asset.id]: event.target.value }))}
                className="mt-3 w-full bg-stone-900 border border-stone-700 px-3 py-2 text-sm text-stone-200"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => void openPreview(asset.id)} className="vn-button px-3 py-2 text-xs">{text.openPreview}</button>
                <button onClick={() => void renameAsset(asset)} className="vn-button px-3 py-2 text-xs">{text.edit}</button>
                <button onClick={() => void deleteAsset(asset)} className="vn-button px-3 py-2 text-xs">{text.delete}</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedAsset && selectedObjectUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 flex items-center justify-center">
          <div className="max-w-5xl w-full max-h-full border border-stone-700 bg-stone-950 p-4 overflow-auto">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-serif text-stone-100">{selectedAsset.name}</h3>
                <p className="text-xs text-stone-500">{selectedAsset.mimeType} - {formatBytes(selectedAsset.size)} - {selectedAsset.width} x {selectedAsset.height}px</p>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="vn-button px-4 py-2">{text.close}</button>
            </div>
            <img src={selectedObjectUrl} alt={selectedAsset.name} className="max-w-full max-h-[75vh] mx-auto object-contain" />
          </div>
        </div>
      )}
    </section>
  );
};

export default ImageAssetLibrary;
