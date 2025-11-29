import React, { useMemo, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import { KeyVector } from './KeyVector';
import { KeyItem, Coordinates } from '@/types';
import { useTheme } from '@/hooks/useThemeColor';

interface PhotoKeyMapProps {
  items: { item: KeyItem; index: number; floorNumber: string }[];
  onMarkerPress?: (item: KeyItem, floorNumber: string) => void;
  height?: number;
}

export interface PhotoKeyMapRef {
  focusOnCoordinate: (coordinate: Coordinates) => void;
}

function PhotoKeyMapComponent(
  { items, onMarkerPress, height = 250 }: PhotoKeyMapProps,
  ref: React.ForwardedRef<PhotoKeyMapRef>
) {
  const { theme, colors } = useTheme();
  const mapRef = useRef<MapView>(null);

  // Filter items with valid GPS coordinates
  const itemsWithCoordinates = useMemo(() => {
    return items.filter((entry) => entry.item.coordinates !== null);
  }, [items]);

  // Calculate the region to fit all markers
  const region = useMemo((): Region | null => {
    if (itemsWithCoordinates.length === 0) return null;

    const lats = itemsWithCoordinates.map((entry) => entry.item.coordinates!.latitude);
    const lngs = itemsWithCoordinates.map((entry) => entry.item.coordinates!.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.005);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.005);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [itemsWithCoordinates]);

  // Expose focusOnCoordinate method via ref
  useImperativeHandle(ref, () => ({
    focusOnCoordinate: (coordinate: Coordinates) => {
      mapRef.current?.animateToRegion(
        {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        500
      );
    },
  }));

  // Fit map to show all markers
  const fitToAllMarkers = useCallback(() => {
    if (itemsWithCoordinates.length === 0) return;

    const coordinates = itemsWithCoordinates.map((entry) => ({
      latitude: entry.item.coordinates!.latitude,
      longitude: entry.item.coordinates!.longitude,
    }));

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  }, [itemsWithCoordinates]);

  // Fit map to markers when region changes
  useEffect(() => {
    if (region && mapRef.current && itemsWithCoordinates.length > 0) {
      const coordinates = itemsWithCoordinates.map((entry) => ({
        latitude: entry.item.coordinates!.latitude,
        longitude: entry.item.coordinates!.longitude,
      }));

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: false,
        });
      }, 100);
    }
  }, [itemsWithCoordinates, region]);

  // Don't render if no items have GPS
  if (itemsWithCoordinates.length === 0 || !region) {
    return null;
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        userInterfaceStyle={theme}
      >
        {itemsWithCoordinates.map((entry) => (
          <Marker
            key={entry.item.id}
            coordinate={{
              latitude: entry.item.coordinates!.latitude,
              longitude: entry.item.coordinates!.longitude,
            }}
            onPress={() => onMarkerPress?.(entry.item, entry.floorNumber)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <KeyVector
              number={entry.index + 1}
              direction={entry.item.direction}
              size={48}
            />
          </Marker>
        ))}
      </MapView>

      {/* Fit all markers button */}
      <Pressable
        onPress={fitToAllMarkers}
        style={({ pressed }) => [
          styles.fitButton,
          { backgroundColor: colors.cardBackground },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Ionicons name="scan-outline" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

export const PhotoKeyMap = forwardRef<PhotoKeyMapRef, PhotoKeyMapProps>(PhotoKeyMapComponent);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  fitButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
