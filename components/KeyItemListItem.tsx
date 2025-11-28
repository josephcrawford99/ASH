import { useState } from 'react';
import { StyleSheet, View, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { KeyItem } from '@/types';

interface KeyItemListItemProps {
  item: KeyItem;
  index: number;
  onPress: () => void;
}

export function KeyItemListItem({ item, index, onPress }: KeyItemListItemProps) {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.cardBackground },
        pressed && { backgroundColor: colors.highlight },
      ]}
    >
      <View style={styles.indexContainer}>
        <ThemedText style={styles.indexText}>{index + 1}</ThemedText>
      </View>
      {imageError ? (
        <View style={[styles.thumbnail, styles.errorPlaceholder]}>
          <Ionicons name="image-outline" size={24} color={colors.icon} />
        </View>
      ) : (
        <Image
          source={{ uri: item.photoUri }}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      )}
      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {item.name}
        </ThemedText>
        {item.coordinates ? (
          <ThemedText style={[styles.coordinates, { color: colors.icon }]} numberOfLines={1}>
            {item.coordinates.latitude.toFixed(6)}, {item.coordinates.longitude.toFixed(6)}
          </ThemedText>
        ) : (
          <ThemedText style={[styles.coordinates, { color: colors.icon }]}>
            No location data
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  indexContainer: {
    width: 24,
    alignItems: 'center',
  },
  indexText: {
    fontSize: 14,
    opacity: 0.5,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#333',
  },
  errorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
  },
  coordinates: {
    fontSize: 12,
    fontFamily: 'Courier',
  },
});
