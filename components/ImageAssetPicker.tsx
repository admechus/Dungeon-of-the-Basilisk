import React, { useEffect, useState } from 'react';
import { listImageAssetMetadata } from '../imageAssetStorage';
import { LocalImageAssetMetadata } from '../types';
import { TeacherEditorText } from '../teacherEditorUi';
import ImageAssetPreview from './ImageAssetPreview';

interface ImageAssetPickerProps {
  label: string;
  value?: string | null;
  onChange: (assetId: string | null) => void;
  text: TeacherEditorText;
}

const ImageAssetPicker: React.FC<ImageAssetPickerProps> = ({ label, value, onChange, text }) => {
  const [assets, setAssets] = useState<LocalImageAssetMetadata[]>([]);
  const [errorText, setErrorText] = useState('');
  const selectedAsset = assets.find((asset) => asset.id === value);
  const isMissingSelection = Boolean(value) && !selectedAsset && !errorText;

  useEffect(() => {
    let isActive = true;

    listImageAssetMetadata()
      .then((nextAssets) => {
        if (!isActive) return;
        setAssets(nextAssets);
        setErrorText('');
      })
      .catch((error) => {
        if (!isActive) return;
        setErrorText(error instanceof Error ? error.message : text.imageLibraryUnavailable);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="border border-stone-800 bg-stone-950/60 p-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs uppercase tracking-widest text-stone-500">{label}</span>
        <button onClick={() => onChange(null)} className="vn-button px-2 py-1 text-xs">{text.clear}</button>
      </div>

      {errorText && <p className="text-xs text-red-300 border border-red-900/60 bg-red-950/30 p-2">{errorText}</p>}
      {isMissingSelection && <p className="text-xs text-amber-300 border border-amber-900/60 bg-amber-950/30 p-2 mb-2">{text.missingImage}</p>}
      {selectedAsset && <p className="text-xs text-amber-300 mb-2">{text.selected.replace('{name}', selectedAsset.name)}</p>}

      {assets.length === 0 && !errorText ? (
        <p className="text-xs text-stone-500">{text.imagePickerEmpty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
          {assets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => onChange(asset.id)}
              className={`text-left border p-2 bg-black/30 ${value === asset.id ? 'border-amber-500' : 'border-stone-800'}`}
            >
              <ImageAssetPreview
                assetId={asset.id}
                alt={asset.name}
                className="w-full aspect-video object-cover border border-stone-800 mb-2"
                missingLabel={text.imageUnavailable}
                loadingLabel={text.loadingImage}
              />
              <span className="block text-xs text-stone-300 truncate">{asset.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageAssetPicker;
