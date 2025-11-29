import { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePhotoKeyStore } from '@/store/photoKeyStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { NewPhotoKeyModal } from '@/components/NewPhotoKeyModal';
import { PlusButton } from '@/components/PlusButton';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/spacing';
import { PhotoKey } from '@/types';
import { BorderRadius } from '@/constants/spacing';

export default function Index() {
  const { colors } = useTheme();
  const photoKeys = usePhotoKeyStore((state) => state.photoKeys);
  const addPhotoKey = usePhotoKeyStore((state) => state.addPhotoKey);
  const [modalVisible, setModalVisible] = useState(false);

  // Sort by lastModified, newest first
  const sortedKeys = Object.values(photoKeys).sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  const handleCreateKey = () => {
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const handleCreate = (name: string) => {
    const newId = addPhotoKey(name);
    setModalVisible(false);
    router.push(`/keyview/${newId}`);
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
          <PlusButton onPress={handleCreateKey} />
        </View>

        <FlatList
          data={sortedKeys}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[styles.listContent, sortedKeys.length === 0 && styles.emptyList]}
          style={styles.listContainer}
        />
      </SafeAreaView>

      <NewPhotoKeyModal
        visible={modalVisible}
        onClose={handleModalClose}
        onCreate={handleCreate}
      />
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  emptyList: {
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  emptyText: {
    opacity: 0.5,
  },
});
