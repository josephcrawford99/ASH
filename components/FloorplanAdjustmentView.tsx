import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable, Image, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { KeyVector } from './KeyVector';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/spacing';
import { Floorplan, KeyItem, Coordinates } from '@/types';

interface FloorplanAdjustmentViewProps {
  visible: boolean;
  floorplan: Floorplan;
  keyitems: KeyItem[];
  onSave: (updates: { centerCoordinates: Coordinates; rotation: number; scale: number }) => void;
  onCancel: () => void;
}

export function FloorplanAdjustmentView({
  visible,
  floorplan,
  keyitems,
  onSave,
  onCancel,
}: FloorplanAdjustmentViewProps) {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { width: screenWidth } = useWindowDimensions();

  // Track current map region for saving
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  // Track floorplan image dimensions
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Get floorplan image dimensions when visible
  useEffect(() => {
    if (visible && floorplan.imageUri) {
      Image.getSize(
        floorplan.imageUri,
        (width, height) => {
          setImageDimensions({ width, height });
        },
        () => {
          // Fallback to square
          setImageDimensions({ width: 1, height: 1 });
        }
      );
    }
  }, [visible, floorplan.imageUri]);

  // Calculate container size to match floorplan aspect ratio
  const containerSize = useMemo(() => {
    if (!imageDimensions) return null;

    const { width, height } = imageDimensions;
    const aspect = width / height;
    const maxWidth = screenWidth;

    // Calculate dimensions that fit the screen width while maintaining aspect ratio
    if (aspect >= 1) {
      // Wider than tall
      return { width: maxWidth, height: maxWidth / aspect };
    } else {
      // Taller than wide - still fit to width
      return { width: maxWidth, height: maxWidth / aspect };
    }
  }, [imageDimensions, screenWidth]);

  // Filter items with GPS coordinates
  const markersWithCoords = useMemo(() => {
    return keyitems
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.item.coordinates !== null);
  }, [keyitems]);

  // Calculate marker bounds for initial region
  const markerBounds = useMemo(() => {
    if (markersWithCoords.length === 0) return null;

    const lats = markersWithCoords.map((m) => m.item.coordinates!.latitude);
    const lngs = markersWithCoords.map((m) => m.item.coordinates!.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      centerLat: (minLat + maxLat) / 2,
      centerLng: (minLng + maxLng) / 2,
      latSpan: Math.max(maxLat - minLat, 0.0005),
      lngSpan: Math.max(maxLng - minLng, 0.0005),
    };
  }, [markersWithCoords]);

  // Check if floorplan has been saved before (has non-default values)
  const hasSavedPosition = useMemo(() => {
    return (
      floorplan.centerCoordinates.latitude !== 0 &&
      floorplan.centerCoordinates.longitude !== 0 &&
      floorplan.scale > 0 &&
      floorplan.scale !== 1.0 // 1.0 is the default
    );
  }, [floorplan]);

  // Initial region - use saved values if available, otherwise marker bounds
  const initialRegion = useMemo(() => {
    // If we have saved position, use it
    if (hasSavedPosition) {
      return {
        latitude: floorplan.centerCoordinates.latitude,
        longitude: floorplan.centerCoordinates.longitude,
        latitudeDelta: floorplan.scale,
        longitudeDelta: floorplan.rotation > 0 ? floorplan.rotation : floorplan.scale,
      };
    }

    // Otherwise use marker bounds for new floorplans
    if (!markerBounds) return null;

    const latDelta = Math.max(markerBounds.latSpan * 1.5, 0.005);
    const lngDelta = Math.max(markerBounds.lngSpan * 1.5, 0.005);

    return {
      latitude: markerBounds.centerLat,
      longitude: markerBounds.centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [markerBounds, floorplan, hasSavedPosition]);

  // Fit map to markers only for NEW floorplans (no saved position)
  useEffect(() => {
    if (visible && !hasSavedPosition && markersWithCoords.length > 0 && mapRef.current) {
      const coordinates = markersWithCoords.map((m) => ({
        latitude: m.item.coordinates!.latitude,
        longitude: m.item.coordinates!.longitude,
      }));

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: false,
        });
      }, 100);
    }
  }, [visible, markersWithCoords, hasSavedPosition]);

  // Handle save - capture current map region
  // We store latitudeDelta in scale and longitudeDelta in rotation (repurposed)
  const handleSave = useCallback(() => {
    if (currentRegion) {
      onSave({
        centerCoordinates: {
          latitude: currentRegion.latitude,
          longitude: currentRegion.longitude,
        },
        rotation: currentRegion.longitudeDelta, // Store longitudeDelta here
        scale: currentRegion.latitudeDelta,
      });
    } else if (initialRegion) {
      // Fallback to initial region if no changes made
      onSave({
        centerCoordinates: {
          latitude: initialRegion.latitude,
          longitude: initialRegion.longitude,
        },
        rotation: initialRegion.longitudeDelta,
        scale: initialRegion.latitudeDelta,
      });
    }
  }, [currentRegion, initialRegion, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Show message if no GPS data for markers
  if (markersWithCoords.length === 0 || !initialRegion) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.5 }]}
            >
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Adjust Floorplan
            </ThemedText>
            <View style={styles.headerButton} />
          </View>
          <View style={styles.noDataContainer}>
            <Ionicons name="location-outline" size={48} color={colors.icon} />
            <ThemedText style={styles.noDataText}>
              No photos with GPS data on this floor
            </ThemedText>
            <ThemedText style={styles.noDataSubtext}>
              Add photos with location data to align the floorplan
            </ThemedText>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.5 }]}
          >
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Adjust Floorplan
          </ThemedText>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.5 }]}
          >
            <ThemedText style={[styles.saveText, { color: colors.text }]}>Save</ThemedText>
          </Pressable>
        </View>

        {/* Map container - sized to match floorplan aspect ratio */}
        <View style={styles.mapWrapper}>
          {containerSize && (
            <View style={[styles.mapContainer, { width: containerSize.width, height: containerSize.height }]}>
              {/* MapView - user can pan and zoom this */}
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={initialRegion}
                onRegionChangeComplete={setCurrentRegion}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                rotateEnabled={false}
                userInterfaceStyle={theme}
              >
                {/* KeyVector markers at their GPS positions */}
                {markersWithCoords.map(({ item, index }) => (
                  <Marker
                    key={item.id}
                    coordinate={item.coordinates as Coordinates}
                    anchor={{ x: 0.5, y: 0.5 }}
                    flat={true}
                    tracksViewChanges={false}
                  >
                    <KeyVector number={index + 1} direction={item.direction} size={36} />
                  </Marker>
                ))}
              </MapView>

              {/* Floorplan overlay - fills container exactly (same aspect ratio) */}
              <View style={styles.floorplanOverlay} pointerEvents="none">
                <Image
                  source={{ uri: floorplan.imageUri }}
                  style={styles.floorplanImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <ThemedText style={styles.instructionText}>
            Pinch to zoom and drag the map to align the markers with the floorplan
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  headerButton: {
    padding: Spacing.xs,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 17,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
  },
  mapWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    position: 'relative',
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  noDataSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.5,
  },
  instructions: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
  },
});
