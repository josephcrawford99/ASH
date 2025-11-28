import { StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePhotoKeyStore, PhotoKeyStore } from '@/store/photoKeyStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function KeyViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const photoKey = usePhotoKeyStore((state: PhotoKeyStore) => state.photoKeys[id ?? '']);

  if (!photoKey) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Photo key not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{photoKey.name}</ThemedText>
      <ThemedText>Created: {new Date(photoKey.dateCreated).toLocaleDateString()}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
