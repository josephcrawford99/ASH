import React, { useRef, useCallback } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Floorplan, Coordinates } from '@/types';

interface VectorData {
  number: number;
  direction: number | null;
  coordinates: Coordinates;
}

interface FloorplanCaptureProps {
  floorplan: Floorplan;
  vectors: VectorData[];
  vectorBase64: string; // base64 data URI for vector.png
  width?: number;
  height?: number;
  vectorSize?: number;
  onCapture: (base64: string) => void;
}

// KeyVector that uses base64 data URI instead of require()
// Data URIs load synchronously, ensuring vector is rendered before capture
interface CaptureKeyVectorProps {
  number: number;
  direction: number | null;
  size: number;
  vectorBase64: string;
}

function CaptureKeyVector({ number, direction, size, vectorBase64 }: CaptureKeyVectorProps) {
  const rotation = direction ?? 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={{ uri: vectorBase64 }}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          transform: [{ rotate: `${rotation}deg` }],
        }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: size * 0.32, fontWeight: '600', color: '#1A1A1A' }}>{number}</Text>
    </View>
  );
}

// Calculate pixel position of a marker on the floorplan
function calculatePosition(
  markerCoords: Coordinates,
  floorplan: Floorplan,
  width: number,
  height: number
): { x: number; y: number } | null {
  if (!floorplan.centerCoordinates || floorplan.scale <= 0) {
    return null;
  }

  const deltaLat = markerCoords.latitude - floorplan.centerCoordinates.latitude;
  const deltaLng = markerCoords.longitude - floorplan.centerCoordinates.longitude;

  // scale = latitudeDelta, rotation = longitudeDelta (repurposed)
  const latDelta = floorplan.scale;
  const lngDelta = floorplan.rotation > 0 ? floorplan.rotation : floorplan.scale;

  // Convert to percentage then to pixels
  const xPercent = 50 + (deltaLng / lngDelta) * 100;
  const yPercent = 50 - (deltaLat / latDelta) * 100;

  return {
    x: (xPercent / 100) * width,
    y: (yPercent / 100) * height,
  };
}

export function FloorplanCapture({
  floorplan,
  vectors,
  vectorBase64,
  width = 400,
  height = 400,
  vectorSize = 36,
  onCapture,
}: FloorplanCaptureProps) {
  const viewRef = useRef<View>(null);

  // Capture after image loads and view is painted
  const handleImageLoad = useCallback(() => {
    if (viewRef.current) {
      // Wait for next frame (paint) + extra delay for rendering to complete
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
    } else {
      onCapture('');
    }
  }, [onCapture]);

  // Calculate positions for all vectors (in pixels)
  const positionedVectors = vectors
    .map((v) => {
      const position = calculatePosition(v.coordinates, floorplan, width, height);
      if (!position) return null;
      return { ...v, position };
    })
    .filter((v): v is VectorData & { position: { x: number; y: number } } => v !== null);

  return (
    <View ref={viewRef} style={[styles.container, { width, height }]} collapsable={false}>
      {/* Floorplan image - onLoad triggers capture */}
      <Image
        source={{ uri: floorplan.imageUri }}
        style={styles.floorplanImage}
        resizeMode="contain"
        onLoad={handleImageLoad}
      />

      {/* Positioned vectors - using CaptureKeyVector with base64 data URI */}
      {positionedVectors.map((v) => (
        <View
          key={v.number}
          style={[
            styles.vectorContainer,
            {
              left: v.position.x - vectorSize / 2,
              top: v.position.y - vectorSize / 2,
            },
          ]}
        >
          <CaptureKeyVector
            number={v.number}
            direction={v.direction}
            size={vectorSize}
            vectorBase64={vectorBase64}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  floorplanImage: {
    width: '100%',
    height: '100%',
  },
  vectorContainer: {
    position: 'absolute',
  },
});
