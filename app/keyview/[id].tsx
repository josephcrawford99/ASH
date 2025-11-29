import { useLayoutEffect, useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Pressable, Alert, SectionList } from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePhotoKeyStore, PhotoKeyStore } from '@/store/photoKeyStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { EditKeyModal, EditKeyModalRef } from '@/components/EditKeyModal';
import { KeyItemListItem } from '@/components/KeyItemListItem';
import { PhotoDetailModal, PhotoDetailModalRef } from '@/components/PhotoDetailModal';
import { FloorplanModal, FloorplanModalRef } from '@/components/FloorplanModal';
import { FloorplanAdjustmentView } from '@/components/FloorplanAdjustmentView';
import { PhotoKeyMap } from '@/components/PhotoKeyMap';
import { PdfExportContainer } from '@/components/PdfExportContainer';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/spacing';
import { pickAndImportPhotos, pickFloorplanImage } from '@/utils/photoImport';
import { KeyItem, Coordinates } from '@/types';

export default function KeyViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const photoKey = usePhotoKeyStore((state: PhotoKeyStore) => state.photoKeys[id ?? '']);
  const removePhotoKey = usePhotoKeyStore((state: PhotoKeyStore) => state.removePhotoKey);
  const addKeyItem = usePhotoKeyStore((state: PhotoKeyStore) => state.addKeyItem);
  const removeKeyItem = usePhotoKeyStore((state: PhotoKeyStore) => state.removeKeyItem);
  const moveKeyItemToFloor = usePhotoKeyStore((state: PhotoKeyStore) => state.moveKeyItemToFloor);
  const addFloorplan = usePhotoKeyStore((state: PhotoKeyStore) => state.addFloorplan);
  const updateFloorplan = usePhotoKeyStore((state: PhotoKeyStore) => state.updateFloorplan);
  const editModalRef = useRef<EditKeyModalRef>(null);
  const photoDetailRef = useRef<PhotoDetailModalRef>(null);
  const floorplanModalRef = useRef<FloorplanModalRef>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPickingFloorplan, setIsPickingFloorplan] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ item: KeyItem; floorNumber: string } | null>(null);
  const [selectedFloorForFloorplan, setSelectedFloorForFloorplan] = useState<string | null>(null);
  const [showFloorplanAdjustment, setShowFloorplanAdjustment] = useState(false);

  const handleOpenEditModal = useCallback(() => {
    editModalRef.current?.present();
  }, []);

  const handleDeleteKey = useCallback(() => {
    if (id) {
      removePhotoKey(id);
      router.back();
    }
  }, [id, removePhotoKey]);

  const handleAddPhotos = useCallback(async () => {
    if (!id || isImporting) return;

    setIsImporting(true);
    try {
      const result = await pickAndImportPhotos();

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to import photos');
        return;
      }

      if (result.items.length === 0) {
        return;
      }

      // Add each photo to the unassigned floor
      for (const item of result.items) {
        addKeyItem(id, 'unassigned', item);
      }
    } catch {
      Alert.alert('Error', 'Failed to import photos');
    } finally {
      setIsImporting(false);
    }
  }, [id, isImporting, addKeyItem]);

  const handlePhotoPress = useCallback((item: KeyItem, floorNumber: string) => {
    setSelectedPhoto({ item, floorNumber });
  }, []);

  // Present modal after selectedPhoto is set
  useEffect(() => {
    if (selectedPhoto) {
      photoDetailRef.current?.present();
    }
  }, [selectedPhoto]);

  const handleSaveFloor = useCallback((newFloorNumber: string) => {
    if (!id || !selectedPhoto) return;

    const { item, floorNumber: currentFloor } = selectedPhoto;

    if (currentFloor !== newFloorNumber) {
      moveKeyItemToFloor(id, item.id, currentFloor, newFloorNumber);
    }
    setSelectedPhoto(null);
  }, [id, selectedPhoto, moveKeyItemToFloor]);

  const handleRemovePhoto = useCallback(() => {
    if (!id || !selectedPhoto) return;

    const { item, floorNumber } = selectedPhoto;
    removeKeyItem(id, floorNumber, item.id);
    setSelectedPhoto(null);
  }, [id, selectedPhoto, removeKeyItem]);

  // Calculate average GPS coordinates for a floor's photos
  const getFloorCenterCoordinates = useCallback((floorNumber: string): Coordinates | null => {
    if (!photoKey) return null;

    const floor = photoKey.floors[floorNumber];
    if (!floor) return null;

    const photosWithCoords = floor.keyitems.filter(item => item.coordinates !== null);
    if (photosWithCoords.length === 0) return null;

    const avgLat = photosWithCoords.reduce((sum, item) => sum + item.coordinates!.latitude, 0) / photosWithCoords.length;
    const avgLng = photosWithCoords.reduce((sum, item) => sum + item.coordinates!.longitude, 0) / photosWithCoords.length;

    return { latitude: avgLat, longitude: avgLng };
  }, [photoKey]);

  // Handle floor header tap to open floorplan modal
  const handleFloorHeaderPress = useCallback((floorNumber: string) => {
    if (floorNumber === 'unassigned') return;
    setSelectedFloorForFloorplan(floorNumber);
    floorplanModalRef.current?.present();
  }, []);

  // Handle picking a new floorplan image
  const handlePickFloorplanImage = useCallback(async () => {
    if (!id || !selectedFloorForFloorplan || isPickingFloorplan) return;

    setIsPickingFloorplan(true);
    try {
      const centerCoords = getFloorCenterCoordinates(selectedFloorForFloorplan);
      const result = await pickFloorplanImage(selectedFloorForFloorplan, centerCoords);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to pick floorplan');
        return;
      }

      if (result.floorplan) {
        addFloorplan(id, selectedFloorForFloorplan, result.floorplan);
      }
    } catch {
      Alert.alert('Error', 'Failed to add floorplan');
    } finally {
      setIsPickingFloorplan(false);
      setSelectedFloorForFloorplan(null);
    }
  }, [id, selectedFloorForFloorplan, isPickingFloorplan, addFloorplan, getFloorCenterCoordinates]);

  // Get the current floorplan for the selected floor
  const selectedFloorFloorplan = useMemo(() => {
    if (!photoKey || !selectedFloorForFloorplan) return null;
    return photoKey.floors[selectedFloorForFloorplan]?.floorplan ?? null;
  }, [photoKey, selectedFloorForFloorplan]);

  // Get the key items for the selected floor
  const selectedFloorKeyItems = useMemo(() => {
    if (!photoKey || !selectedFloorForFloorplan) return [];
    return photoKey.floors[selectedFloorForFloorplan]?.keyitems ?? [];
  }, [photoKey, selectedFloorForFloorplan]);

  // Handle opening the floorplan adjustment view
  const handleOpenAdjustment = useCallback(() => {
    setShowFloorplanAdjustment(true);
  }, []);

  // Handle saving floorplan adjustments
  const handleSaveAdjustment = useCallback(
    (updates: { centerCoordinates: { latitude: number; longitude: number }; rotation: number; scale: number }) => {
      if (!id || !selectedFloorForFloorplan) return;
      updateFloorplan(id, selectedFloorForFloorplan, updates);
      setShowFloorplanAdjustment(false);
    },
    [id, selectedFloorForFloorplan, updateFloorplan]
  );

  // Handle canceling floorplan adjustment
  const handleCancelAdjustment = useCallback(() => {
    setShowFloorplanAdjustment(false);
  }, []);

  // Handle PDF export
  const handleExportPdf = useCallback(() => {
    if (!photoKey || isExporting) return;
    setIsExporting(true);
  }, [photoKey, isExporting]);

  // Handle PDF export completion
  const handleExportComplete = useCallback((success: boolean, error?: string) => {
    setIsExporting(false);
    if (!success && error) {
      Alert.alert('Export Failed', error);
    }
  }, []);

  // Set header title to uppercase photo key name
  useLayoutEffect(() => {
    if (photoKey) {
      navigation.setOptions({
        title: photoKey.name.toUpperCase(),
        headerRight: () => (
          <View style={styles.headerRight}>
            <Pressable
              onPress={handleAddPhotos}
              style={({ pressed }) => [
                styles.plusButton,
                { backgroundColor: colors.text },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="add" size={22} color={colors.background} />
            </Pressable>
            <Pressable
              onPress={handleOpenEditModal}
              style={({ pressed }) => [
                styles.editButton,
                pressed && { opacity: 0.5 },
              ]}
            >
              <ThemedText style={[styles.editButtonText, { color: colors.text }]}>
                Edit
              </ThemedText>
            </Pressable>
          </View>
        ),
      });
    }
  }, [navigation, photoKey, colors, handleOpenEditModal, handleAddPhotos]);

  // Build sections for SectionList
  const sections = useMemo(() => {
    if (!photoKey) return [];

    const floorEntries = Object.entries(photoKey.floors);

    // Sort floors: unassigned first, then numeric floors ascending
    floorEntries.sort(([a], [b]) => {
      if (a === 'unassigned') return -1;
      if (b === 'unassigned') return 1;
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });

    return floorEntries
      .filter(([, floor]) => floor.keyitems.length > 0)
      .map(([floorNumber, floor]) => ({
        title: floorNumber === 'unassigned' ? 'Unassigned' : `Floor ${floorNumber}`,
        floorNumber,
        hasFloorplan: floor.floorplan !== null,
        data: floor.keyitems,
      }));
  }, [photoKey]);

  // Calculate global index for each item (for numbering)
  const getGlobalIndex = useCallback((sectionIndex: number, itemIndex: number): number => {
    let count = 0;
    for (let i = 0; i < sectionIndex; i++) {
      count += sections[i].data.length;
    }
    return count + itemIndex;
  }, [sections]);

  const totalItems = useMemo(() => {
    return sections.reduce((sum, section) => sum + section.data.length, 0);
  }, [sections]);

  // Build flat list of items with indices for the map
  const mapItems = useMemo(() => {
    const items: { item: KeyItem; index: number; floorNumber: string }[] = [];
    let globalIndex = 0;

    for (const section of sections) {
      for (const item of section.data) {
        items.push({ item, index: globalIndex, floorNumber: section.floorNumber });
        globalIndex++;
      }
    }

    return items;
  }, [sections]);

  // Check if any items have GPS coordinates
  const hasGpsItems = useMemo(() => {
    return mapItems.some((entry) => entry.item.coordinates !== null);
  }, [mapItems]);

  if (!photoKey) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Photo key not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {totalItems === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No photos yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Tap the + button to add photos
          </ThemedText>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            hasGpsItems ? (
              <PhotoKeyMap
                items={mapItems}
                onMarkerPress={handlePhotoPress}
                height={250}
              />
            ) : null
          }
          renderItem={({ item, index, section }) => {
            const sectionIndex = sections.findIndex((s) => s.floorNumber === section.floorNumber);
            const globalIndex = getGlobalIndex(sectionIndex, index);
            return (
              <KeyItemListItem
                item={item}
                index={globalIndex}
                onPress={() => handlePhotoPress(item, section.floorNumber)}
              />
            );
          }}
          renderSectionHeader={({ section: { title, floorNumber, hasFloorplan } }) => {
            const isUnassigned = floorNumber === 'unassigned';

            if (isUnassigned) {
              // Unassigned section is not pressable
              return (
                <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                  <ThemedText style={styles.sectionHeaderText}>{title}</ThemedText>
                </View>
              );
            }

            // Floor sections are pressable to add/manage floorplan
            return (
              <Pressable
                onPress={() => handleFloorHeaderPress(floorNumber)}
                style={({ pressed }) => [
                  styles.sectionHeader,
                  styles.sectionHeaderPressable,
                  { backgroundColor: colors.background },
                  pressed && { opacity: 0.6 },
                ]}
              >
                <ThemedText style={styles.sectionHeaderText}>{title}</ThemedText>
                <View style={styles.sectionHeaderRight}>
                  {hasFloorplan ? (
                    <Ionicons name="image" size={16} color={colors.text} style={{ opacity: 0.6 }} />
                  ) : (
                    <ThemedText style={styles.sectionHeaderHint}>Tap to add floorplan</ThemedText>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.text} style={{ opacity: 0.4 }} />
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
          stickySectionHeadersEnabled={true}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <View style={styles.exportButtonContainer}>
              <Pressable
                onPress={handleExportPdf}
                disabled={isExporting}
                style={({ pressed }) => [
                  styles.exportPdfButton,
                  { backgroundColor: colors.text },
                  pressed && { opacity: 0.7 },
                  isExporting && { opacity: 0.5 },
                ]}
              >
                <Ionicons name="document-text-outline" size={20} color={colors.background} />
                <ThemedText style={[styles.exportPdfButtonText, { color: colors.background }]}>
                  {isExporting ? 'Generating PDF...' : 'View Photo Key PDF'}
                </ThemedText>
              </Pressable>
            </View>
          }
        />
      )}

      <EditKeyModal
        ref={editModalRef}
        photoKey={photoKey}
        onDelete={handleDeleteKey}
      />

      <PhotoDetailModal
        ref={photoDetailRef}
        item={selectedPhoto?.item ?? null}
        onSave={handleSaveFloor}
        onRemove={handleRemovePhoto}
      />

      <FloorplanModal
        ref={floorplanModalRef}
        floorNumber={selectedFloorForFloorplan ?? ''}
        floorplan={selectedFloorFloorplan}
        onPickImage={handlePickFloorplanImage}
        onAdjustPosition={selectedFloorFloorplan ? handleOpenAdjustment : undefined}
      />

      {selectedFloorFloorplan && (
        <FloorplanAdjustmentView
          visible={showFloorplanAdjustment}
          floorplan={selectedFloorFloorplan}
          keyitems={selectedFloorKeyItems}
          onSave={handleSaveAdjustment}
          onCancel={handleCancelAdjustment}
        />
      )}

      {isExporting && photoKey && (
        <PdfExportContainer
          photoKey={photoKey}
          visible={isExporting}
          onComplete={handleExportComplete}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  exportButtonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  exportPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
  },
  exportPdfButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  plusButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  editButtonText: {
    fontSize: 17,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  sectionHeaderPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionHeaderHint: {
    fontSize: 12,
    opacity: 0.4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56 + Spacing.sm + Spacing.sm + 24, // thumbnail width + gaps + index
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    opacity: 0.5,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.4,
    textAlign: 'center',
  },
});
