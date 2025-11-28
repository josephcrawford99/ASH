import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Overlay, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { KeyVector } from './KeyVector';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/spacing';
import { Floorplan, KeyItem, Coordinates } from '@/types';

// Adjustment step sizes
const COORD_STEP = 0.00005; // ~5 meters
const ROTATION_STEP = 5; // degrees
const SCALE_STEP = 0.1; // multiplier increment
const MIN_SCALE = 0.2;
const MAX_SCALE = 3.0;

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

  // Local state for adjustments
  const [centerLat, setCenterLat] = useState(floorplan.centerCoordinates.latitude);
  const [centerLng, setCenterLng] = useState(floorplan.centerCoordinates.longitude);
  const [rotation, setRotation] = useState(floorplan.rotation);
  const [scale, setScale] = useState(floorplan.scale);

  // Filter items with GPS coordinates
  const markersWithCoords = useMemo(() => {
    return keyitems
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.item.coordinates !== null);
  }, [keyitems]);

  // Calculate marker bounds for base overlay size
  const markerBounds = useMemo(() => {
    if (markersWithCoords.length === 0) return null;

    const lats = markersWithCoords.map((m) => m.item.coordinates!.latitude);
    const lngs = markersWithCoords.map((m) => m.item.coordinates!.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      minLat,
      maxLat,
      minLng,
      maxLng,
      centerLat: (minLat + maxLat) / 2,
      centerLng: (minLng + maxLng) / 2,
      latSpan: Math.max(maxLat - minLat, 0.0005), // minimum span
      lngSpan: Math.max(maxLng - minLng, 0.0005),
    };
  }, [markersWithCoords]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCenterLat(floorplan.centerCoordinates.latitude);
      setCenterLng(floorplan.centerCoordinates.longitude);
      setRotation(floorplan.rotation);
      setScale(floorplan.scale);
    }
  }, [visible, floorplan]);

  // Fit map to markers when visible
  useEffect(() => {
    if (visible && mapRef.current && markersWithCoords.length > 0) {
      const coordinates = markersWithCoords.map((entry) => ({
        latitude: entry.item.coordinates!.latitude,
        longitude: entry.item.coordinates!.longitude,
      }));

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: false,
        });
      }, 100);
    }
  }, [visible, markersWithCoords]);

  // Handle save
  const handleSave = useCallback(() => {
    onSave({
      centerCoordinates: { latitude: centerLat, longitude: centerLng },
      rotation,
      scale,
    });
  }, [centerLat, centerLng, rotation, scale, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Position controls - move floorplan center in GPS coordinates
  const moveUp = useCallback(() => setCenterLat((prev) => prev + COORD_STEP), []);
  const moveDown = useCallback(() => setCenterLat((prev) => prev - COORD_STEP), []);
  const moveLeft = useCallback(() => setCenterLng((prev) => prev - COORD_STEP), []);
  const moveRight = useCallback(() => setCenterLng((prev) => prev + COORD_STEP), []);

  // Size controls - scale multiplier
  const sizeUp = useCallback(() => setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE)), []);
  const sizeDown = useCallback(() => setScale((prev) => Math.max(prev - SCALE_STEP, MIN_SCALE)), []);

  // Rotation controls
  const rotateClockwise = useCallback(() => setRotation((prev) => (prev + ROTATION_STEP) % 360), []);
  const rotateCounterClockwise = useCallback(() => setRotation((prev) => (prev - ROTATION_STEP + 360) % 360), []);

  // Calculate overlay bounds based on marker bounds and scale multiplier
  const overlayBounds = useMemo(() => {
    if (!markerBounds) return null;

    // Base size matches the marker span
    const baseLatSpan = markerBounds.latSpan;
    const baseLngSpan = markerBounds.lngSpan;

    // Apply scale multiplier
    const scaledLatSpan = baseLatSpan * scale;
    const scaledLngSpan = baseLngSpan * scale;

    const halfLatSpan = scaledLatSpan / 2;
    const halfLngSpan = scaledLngSpan / 2;

    return [
      [centerLat - halfLatSpan, centerLng - halfLngSpan], // SW corner
      [centerLat + halfLatSpan, centerLng + halfLngSpan], // NE corner
    ] as [[number, number], [number, number]];
  }, [centerLat, centerLng, scale, markerBounds]);

  // Initial region for map (will be overridden by fitToCoordinates)
  const initialRegion = useMemo(() => {
    if (!markerBounds) return null;
    return {
      latitude: markerBounds.centerLat,
      longitude: markerBounds.centerLng,
      latitudeDelta: markerBounds.latSpan * 2,
      longitudeDelta: markerBounds.lngSpan * 2,
    };
  }, [markerBounds]);

  // Show message if no GPS data for markers
  if (markersWithCoords.length === 0 || !initialRegion || !overlayBounds) {
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

        {/* Map with Overlay and Markers */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            userInterfaceStyle={theme}
          >
            {/* Floorplan as Overlay - positioned by GPS bounds */}
            <Overlay
              bounds={overlayBounds}
              image={{ uri: floorplan.imageUri }}
              bearing={rotation}
              opacity={0.5}
            />

            {/* KeyVector markers - FIXED at their GPS positions */}
            {markersWithCoords.map(({ item, index }) => (
              <Marker
                key={item.id}
                coordinate={item.coordinates as Coordinates}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <KeyVector number={index + 1} direction={item.direction} size={36} />
              </Marker>
            ))}
          </MapView>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <ThemedText style={styles.instructionText}>
            Adjust the floorplan to align with the markers
          </ThemedText>
        </View>

        {/* Controls */}
        <View style={[styles.controlsContainer, { backgroundColor: colors.cardBackground }]}>
          {/* Position controls */}
          <View style={styles.controlGroup}>
            <ThemedText style={styles.controlLabel}>Position</ThemedText>
            <View style={styles.arrowControls}>
              <View style={styles.arrowRow}>
                <Pressable
                  onPress={moveUp}
                  style={({ pressed }) => [
                    styles.arrowButton,
                    { backgroundColor: colors.text },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons name="arrow-up" size={20} color={colors.background} />
                </Pressable>
              </View>
              <View style={styles.arrowRow}>
                <Pressable
                  onPress={moveLeft}
                  style={({ pressed }) => [
                    styles.arrowButton,
                    { backgroundColor: colors.text },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.background} />
                </Pressable>
                <View style={styles.arrowSpacer} />
                <Pressable
                  onPress={moveRight}
                  style={({ pressed }) => [
                    styles.arrowButton,
                    { backgroundColor: colors.text },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons name="arrow-forward" size={20} color={colors.background} />
                </Pressable>
              </View>
              <View style={styles.arrowRow}>
                <Pressable
                  onPress={moveDown}
                  style={({ pressed }) => [
                    styles.arrowButton,
                    { backgroundColor: colors.text },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons name="arrow-down" size={20} color={colors.background} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Size controls */}
          <View style={styles.controlGroup}>
            <ThemedText style={styles.controlLabel}>Size</ThemedText>
            <View style={styles.plusMinusControls}>
              <Pressable
                onPress={sizeDown}
                style={({ pressed }) => [
                  styles.plusMinusButton,
                  { backgroundColor: colors.text },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="remove" size={20} color={colors.background} />
              </Pressable>
              <Pressable
                onPress={sizeUp}
                style={({ pressed }) => [
                  styles.plusMinusButton,
                  { backgroundColor: colors.text },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="add" size={20} color={colors.background} />
              </Pressable>
            </View>
          </View>

          {/* Rotation controls */}
          <View style={styles.controlGroup}>
            <ThemedText style={styles.controlLabel}>Rotate</ThemedText>
            <View style={styles.plusMinusControls}>
              <Pressable
                onPress={rotateCounterClockwise}
                style={({ pressed }) => [
                  styles.plusMinusButton,
                  { backgroundColor: colors.text },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={colors.background}
                  style={{ transform: [{ scaleX: -1 }] }}
                />
              </Pressable>
              <Pressable
                onPress={rotateClockwise}
                style={({ pressed }) => [
                  styles.plusMinusButton,
                  { backgroundColor: colors.text },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="refresh-outline" size={20} color={colors.background} />
              </Pressable>
            </View>
          </View>
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
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
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
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.3)',
  },
  controlGroup: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  arrowControls: {
    gap: Spacing.xs,
  },
  arrowRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  arrowSpacer: {
    width: 36,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusMinusControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  plusMinusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
