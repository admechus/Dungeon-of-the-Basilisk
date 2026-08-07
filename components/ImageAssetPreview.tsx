import React, { useEffect, useRef, useState } from 'react';
import { getImageAsset } from '../imageAssetStorage';

interface ImageAssetPreviewProps {
  assetId?: string | null;
  alt: string;
  className: string;
  missingLabel?: string;
  loadingLabel?: string;
}

const ImageAssetPreview: React.FC<ImageAssetPreviewProps> = ({
  assetId,
  alt,
  className,
  missingLabel = 'Image unavailable',
  loadingLabel = 'Loading image',
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    let nextUrl: string | null = null;

    setObjectUrl(null);
    setIsMissing(false);

    if (!assetId) {
      setIsMissing(true);
      return undefined;
    }

    getImageAsset(assetId)
      .then((asset) => {
        if (requestIdRef.current !== requestId) return;
        if (!asset) {
          setIsMissing(true);
          return;
        }

        nextUrl = URL.createObjectURL(asset.blob);
        setObjectUrl(nextUrl);
      })
      .catch(() => {
        if (requestIdRef.current === requestId) {
          setIsMissing(true);
        }
      });

    return () => {
      requestIdRef.current += 1;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [assetId]);

  if (objectUrl) {
    return <img src={objectUrl} alt={alt} className={className} />;
  }

  if (isMissing) {
    return <div className={`${className} flex items-center justify-center bg-stone-900 text-xs text-stone-600`}>{missingLabel}</div>;
  }

  return <div className={`${className} flex items-center justify-center bg-stone-900 text-xs text-stone-600`}>{loadingLabel}</div>;
};

export default ImageAssetPreview;
