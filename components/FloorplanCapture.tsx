import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { FloorKey, FloorKeyVector } from './FloorKey';
import { Floorplan } from '@/types';

interface FloorplanCaptureProps {
  floorplan: Floorplan;
  vectors: FloorKeyVector[];
  vectorBase64: string;
  maxSize?: number;
  vectorSize?: number;
  onCapture: (base64: string) => void;
}

export function FloorplanCapture({
  floorplan,
  vectors,
  vectorBase64,
  maxSize = 600,
  vectorSize = 36,
  onCapture,
}: FloorplanCaptureProps) {
  const viewRef = useRef<View>(null);
  const [mapReady, setMapReady] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Get floorplan image dimensions for aspect ratio calculation
  useEffect(() => {
    Image.getSize(
      floorplan.imageUri,
      (width, height) => {
        setImageDimensions({ width, height });
      },
      () => {
        setImageDimensions({ width: maxSize, height: maxSize });
      }
    );
  }, [floorplan.imageUri, maxSize]);

  // Calculate container size based on floorplan dimensions
  const containerSize = React.useMemo(() => {
    if (!imageDimensions) return { width: maxSize, height: maxSize };

    const { width, height } = imageDimensions;
    const aspect = width / height;

    if (width > height) {
      return { width: maxSize, height: maxSize / aspect };
    } else {
      return { width: maxSize * aspect, height: maxSize };
    }
  }, [imageDimensions, maxSize]);

  const doCapture = useCallback(() => {
    if (mapReady && imageLoaded && viewRef.current) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          captureRef(viewRef, {
            format: 'png',
            quality: 1,
            result: 'base64',
          })
            .then((base64) => {
              if (base64 && base64.length > 1000) {
                onCapture(`data:image/png;base64,${base64}`);
              } else {
                onCapture('');
              }
            })
            .catch(() => {
              onCapture('');
            });
        }, 500);
      });
    }
  }, [mapReady, imageLoaded, onCapture]);

  useEffect(() => {
    if (mapReady && imageLoaded && imageDimensions) {
      doCapture();
    }
  }, [mapReady, imageLoaded, imageDimensions, doCapture]);

  if (!imageDimensions) {
    return null;
  }

  return (
    <View ref={viewRef} collapsable={false}>
      <FloorKey
        floorplan={floorplan}
        vectors={vectors}
        width={containerSize.width}
        height={containerSize.height}
        vectorSize={vectorSize}
        vectorBase64={vectorBase64}
        floorplanOpacity={1}
        interactive={false}
        onMapReady={() => setMapReady(true)}
        onImageLoad={() => setImageLoaded(true)}
      />
    </View>
  );
}
