import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Floorplan, Coordinates } from '@/types';

interface VectorData {
  number: number;
  direction: number | null;
  coordinates: Coordinates;
}

interface FloorplanCaptureProps {
  floorplan: Floorplan;
  vectors: VectorData[];
  vectorBase64: string;
  maxSize?: number; // Max dimension (will scale proportionally)
  vectorSize?: number;
  onCapture: (base64: string) => void;
}

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

  // Get floorplan image dimensions
  useEffect(() => {
    Image.getSize(
      floorplan.imageUri,
      (width, height) => {
        setImageDimensions({ width, height });
      },
      () => {
        // Fallback to square
        setImageDimensions({ width: maxSize, height: maxSize });
      }
    );
  }, [floorplan.imageUri, maxSize]);

  // Calculate container size based on floorplan dimensions (scaled to maxSize)
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

  // The saved region
  const region: Region = {
    latitude: floorplan.centerCoordinates.latitude,
    longitude: floorplan.centerCoordinates.longitude,
    latitudeDelta: floorplan.scale,
    longitudeDelta: floorplan.rotation > 0 ? floorplan.rotation : floorplan.scale,
  };

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

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  useEffect(() => {
    if (mapReady && imageLoaded && imageDimensions) {
      doCapture();
    }
  }, [mapReady, imageLoaded, imageDimensions, doCapture]);

  // Don't render until we have dimensions
  if (!imageDimensions) {
    return null;
  }

  return (
    <View
      ref={viewRef}
      style={[styles.container, { width: containerSize.width, height: containerSize.height }]}
      collapsable={false}
    >
      {/* MapView with markers */}
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType="hybrid"
        initialRegion={region}
        region={region}
        onMapReady={handleMapReady}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        userInterfaceStyle="light"
      >
        {vectors.map((v) => (
          <Marker
            key={v.number}
            coordinate={v.coordinates}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            tracksViewChanges={false}
          >
            <CaptureKeyVector
              number={v.number}
              direction={v.direction}
              size={vectorSize}
              vectorBase64={vectorBase64}
            />
          </Marker>
        ))}
      </MapView>

      {/* Floorplan overlay - fills container exactly (same aspect ratio) */}
      <View style={styles.floorplanOverlay} pointerEvents="none">
        <Image
          source={{ uri: floorplan.imageUri }}
          style={styles.floorplanImage}
          resizeMode="cover"
          onLoad={handleImageLoad}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  floorplanOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  floorplanImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
});
