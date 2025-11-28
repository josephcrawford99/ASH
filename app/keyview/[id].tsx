import { useLayoutEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { usePhotoKeyStore, PhotoKeyStore } from '@/store/photoKeyStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/spacing';

export default function KeyViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const photoKey = usePhotoKeyStore((state: PhotoKeyStore) => state.photoKeys[id ?? '']);

  // Set header title to uppercase photo key name
  useLayoutEffect(() => {
    if (photoKey) {
      navigation.setOptions({
        title: photoKey.name.toUpperCase(),
        headerRight: () => (
          <Pressable
            onPress={() => {
              // TODO: Open edit modal
              console.log('Edit key');
            }}
            style={({ pressed }) => [
              styles.editButton,
              pressed && { opacity: 0.5 },
            ]}
          >
            <ThemedText style={[styles.editButtonText, { color: colors.text }]}>
              Edit
            </ThemedText>
          </Pressable>
        ),
      });
    }
  }, [navigation, photoKey, colors]);

  if (!photoKey) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Photo key not found</ThemedText>
      </ThemedView>
    );
  }

  // Get all key items from all floors
  const allKeyItems = Object.entries(photoKey.floors).flatMap(([floorNumber, floor]) =>
    floor.keyitems.map((item) => ({ ...item, floorNumber }))
  );

  return (
    <ThemedView style={styles.container}>
      {allKeyItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No photos yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Tap the + button to add photos
          </ThemedText>
        </View>
      ) : (
        <View style={styles.content}>
          <ThemedText>
            {allKeyItems.length} photo{allKeyItems.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  editButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  editButtonText: {
    fontSize: 17,
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
