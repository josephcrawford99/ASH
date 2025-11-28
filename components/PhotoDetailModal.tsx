import { useCallback, useMemo, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert, Image, TextInput } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { KeyItem } from '@/types';

interface PhotoDetailModalProps {
  item: KeyItem | null;
  onSave: (floorNumber: string) => void;
  onRemove: () => void;
}

export interface PhotoDetailModalRef {
  present: () => void;
  dismiss: () => void;
}

function PhotoDetailModalComponent(
  { item, onSave, onRemove }: PhotoDetailModalProps,
  ref: React.ForwardedRef<PhotoDetailModalRef>
) {
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [floorInput, setFloorInput] = useState('');

  const snapPoints = useMemo(() => ['70%'], []);

  // Reset floor input when item changes
  useEffect(() => {
    if (item) {
      setFloorInput(item.floorNumber === 'unassigned' ? '' : item.floorNumber);
    }
  }, [item]);

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleSave = useCallback(() => {
    const newFloor = floorInput.trim() || 'unassigned';
    onSave(newFloor);
    bottomSheetRef.current?.dismiss();
  }, [floorInput, onSave]);

  const handleRemove = useCallback(() => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo from the key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            bottomSheetRef.current?.dismiss();
            onRemove();
          },
        },
      ]
    );
  }, [onRemove]);

  if (!item) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: colors.cardBackground }}
      handleIndicatorStyle={{ backgroundColor: colors.icon }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetScrollView style={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          {item.name}
        </ThemedText>

        <Image
          source={{ uri: item.photoUri }}
          style={styles.image}
          resizeMode="contain"
        />

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Location</ThemedText>
            {item.coordinates ? (
              <ThemedText style={[styles.value, styles.mono]}>
                {item.coordinates.latitude.toFixed(6)}, {item.coordinates.longitude.toFixed(6)}
              </ThemedText>
            ) : (
              <ThemedText style={[styles.value, { color: colors.icon }]}>
                No location data
              </ThemedText>
            )}
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Direction</ThemedText>
            {item.direction !== null ? (
              <ThemedText style={[styles.value, styles.mono]}>
                {item.direction.toFixed(0)}°
              </ThemedText>
            ) : (
              <ThemedText style={[styles.value, { color: colors.icon }]}>
                No direction data
              </ThemedText>
            )}
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Floor</ThemedText>
            <TextInput
              style={[
                styles.floorInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={floorInput}
              onChangeText={setFloorInput}
              placeholder="Unassigned"
              placeholderTextColor={colors.icon}
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: colors.text },
              pressed && { opacity: 0.7 },
            ]}
          >
            <ThemedText style={[styles.saveButtonText, { color: colors.background }]}>
              Save
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={handleRemove}
            style={({ pressed }) => [
              styles.removeButton,
              { backgroundColor: colors.error },
              pressed && { opacity: 0.7 },
            ]}
          >
            <ThemedText style={[styles.removeButtonText, { color: '#FFFFFF' }]}>
              Remove Photo
            </ThemedText>
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export const PhotoDetailModal = forwardRef<PhotoDetailModalRef, PhotoDetailModalProps>(PhotoDetailModalComponent);

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    backgroundColor: '#333',
    marginBottom: Spacing.lg,
  },
  infoSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
  },
  mono: {
    fontFamily: 'Courier',
  },
  floorInput: {
    fontSize: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  actions: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
