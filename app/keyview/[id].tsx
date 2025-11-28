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
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/spacing';
import { pickAndImportPhotos } from '@/utils/photoImport';
import { KeyItem } from '@/types';

export default function KeyViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const photoKey = usePhotoKeyStore((state: PhotoKeyStore) => state.photoKeys[id ?? '']);
  const removePhotoKey = usePhotoKeyStore((state: PhotoKeyStore) => state.removePhotoKey);
  const addKeyItem = usePhotoKeyStore((state: PhotoKeyStore) => state.addKeyItem);
  const removeKeyItem = usePhotoKeyStore((state: PhotoKeyStore) => state.removeKeyItem);
  const moveKeyItemToFloor = usePhotoKeyStore((state: PhotoKeyStore) => state.moveKeyItemToFloor);
  const editModalRef = useRef<EditKeyModalRef>(null);
  const photoDetailRef = useRef<PhotoDetailModalRef>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ item: KeyItem; floorNumber: string } | null>(null);

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
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <ThemedText style={styles.sectionHeaderText}>{title}</ThemedText>
            </View>
          )}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
          stickySectionHeadersEnabled={true}
          contentContainerStyle={styles.listContent}
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
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
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
