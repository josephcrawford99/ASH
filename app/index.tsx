import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePhotoKeyStore } from '@/store/photoKeyStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { PhotoKey } from '@/types';

export default function Index() {
  const { colors } = useTheme();
  const photoKeys = usePhotoKeyStore((state) => state.photoKeys);

  // Sort by lastModified, newest first
  const sortedKeys = Object.values(photoKeys).sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  const handleCreateKey = () => {
    // TODO: Open new photo key modal
    console.log('Create new photo key');
  };

  const handleOpenKey = (id: string) => {
    router.push(`/keyview/${id}`);
  };

  const renderItem = ({ item }: { item: PhotoKey }) => (
    <Pressable
      onPress={() => handleOpenKey(item.id)}
      style={({ pressed }) => [
        styles.listItem,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        pressed && { opacity: 0.7 },
      ]}
    >
      <ThemedText type="subtitle">{item.name}</ThemedText>
      <ThemedText style={styles.date}>
        {new Date(item.lastModified).toLocaleDateString()}
      </ThemedText>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>No photo keys yet</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="title">PHOTO KEYS</ThemedText>
          <Pressable
            onPress={handleCreateKey}
            style={({ pressed }) => [
              styles.plusButton,
              { backgroundColor: colors.text },
              pressed && { opacity: 0.7 },
            ]}
          >
            <ThemedText style={[styles.plusIcon, { color: colors.background }]}>+</ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={sortedKeys}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={sortedKeys.length === 0 ? styles.emptyList : styles.list}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  emptyList: {
    flex: 1,
  },
  listItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.5,
  },
});
