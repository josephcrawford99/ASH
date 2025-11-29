import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Floorplan, Coordinates } from '@/types';

export interface FloorKeyVector {
  id: string;
  number: number;
  direction: number | null;
  coordinates: Coordinates;
}

interface FloorKeyVectorMarkerProps {
  number: number;
  direction: number | null;
  size: number;
  vectorBase64?: string;
}

function FloorKeyVectorMarker({ number, direction, size, vectorBase64 }: FloorKeyVectorMarkerProps) {
  const rotation = direction ?? 0;

  // If no base64 provided, use the bundled asset
  const imageSource = vectorBase64
    ? { uri: vectorBase64 }
    : require('@/assets/vector.png');

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={imageSource}
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

export interface FloorKeyProps {
  floorplan: Floorplan;
  vectors: FloorKeyVector[];
  width: number;
  height?: number; // If not provided, calculated from aspect ratio
  vectorSize?: number;
  vectorBase64?: string; // For capture - use data URI
  floorplanOpacity?: number;
  interactive?: boolean;
  onMapReady?: () => void;
  onImageLoad?: () => void;
}

export function FloorKey({
  floorplan,
  vectors,
  width,
  height: providedHeight,
  vectorSize = 36,
  vectorBase64,
  floorplanOpacity = 1,
  interactive = false,
  onMapReady,
  onImageLoad,
}: FloorKeyProps) {
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Get floorplan image dimensions
  useEffect(() => {
    Image.getSize(
      floorplan.imageUri,
      (imgWidth, imgHeight) => {
        setImageDimensions({ width: imgWidth, height: imgHeight });
      },
      () => {
        // Fallback to square
        setImageDimensions({ width: 1, height: 1 });
      }
    );
  }, [floorplan.imageUri]);

  // Calculate container size based on floorplan aspect ratio
  const containerSize = useMemo(() => {
    if (providedHeight) {
      return { width, height: providedHeight };
    }

    if (!imageDimensions) return { width, height: width };

    const aspect = imageDimensions.width / imageDimensions.height;
    return { width, height: width / aspect };
  }, [imageDimensions, width, providedHeight]);

  // The saved region from floorplan
  const region: Region = useMemo(() => ({
    latitude: floorplan.centerCoordinates.latitude,
    longitude: floorplan.centerCoordinates.longitude,
    latitudeDelta: floorplan.scale,
    longitudeDelta: floorplan.rotation > 0 ? floorplan.rotation : floorplan.scale,
  }), [floorplan]);

  // Calculate pixel position for a coordinate
  const getPixelPosition = useCallback((coord: Coordinates) => {
    const x = ((coord.longitude - (region.longitude - region.longitudeDelta / 2)) / region.longitudeDelta) * containerSize.width;
    const y = ((region.latitude + region.latitudeDelta / 2 - coord.latitude) / region.latitudeDelta) * containerSize.height;
    return { x, y };
  }, [region, containerSize]);

  const handleMapReady = useCallback(() => {
    onMapReady?.();
  }, [onMapReady]);

  const handleImageLoad = useCallback(() => {
    onImageLoad?.();
  }, [onImageLoad]);

  // Don't render until we have dimensions (unless height was provided)
  if (!imageDimensions && !providedHeight) {
    return null;
  }

  return (
    <View style={[styles.container, { width: containerSize.width, height: containerSize.height }]}>
      {/* Layer 1: MapView (bottom) */}
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType="hybrid"
        initialRegion={region}
        region={interactive ? undefined : region}
        onMapReady={handleMapReady}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        userInterfaceStyle="light"
      />

      {/* Layer 2: Floorplan overlay (middle) */}
      <View style={styles.floorplanOverlay} pointerEvents="none">
        <Image
          source={{ uri: floorplan.imageUri }}
          style={[styles.floorplanImage, { opacity: floorplanOpacity }]}
          resizeMode="cover"
          onLoad={handleImageLoad}
        />
      </View>

      {/* Layer 3: Vectors (top) */}
      <View style={styles.vectorsOverlay} pointerEvents="none">
        {vectors.map((v) => {
          const pos = getPixelPosition(v.coordinates);
          return (
            <View
              key={v.id}
              style={[
                styles.vectorMarker,
                {
                  left: pos.x - vectorSize / 2,
                  top: pos.y - vectorSize / 2,
                },
              ]}
            >
              <FloorKeyVectorMarker
                number={v.number}
                direction={v.direction}
                size={vectorSize}
                vectorBase64={vectorBase64}
              />
            </View>
          );
        })}
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
    ...StyleSheet.absoluteFillObject,
  },
  floorplanOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  floorplanImage: {
    width: '100%',
    height: '100%',
  },
  vectorsOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  vectorMarker: {
    position: 'absolute',
  },
});
