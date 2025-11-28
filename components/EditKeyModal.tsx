import { useCallback, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { PhotoKey } from '@/types';

interface EditKeyModalProps {
  photoKey: PhotoKey | null;
  onDelete: () => void;
}

export interface EditKeyModalRef {
  present: () => void;
  dismiss: () => void;
}

function EditKeyModalComponent(
  { photoKey, onDelete }: EditKeyModalProps,
  ref: React.ForwardedRef<EditKeyModalRef>
) {
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['30%'], []);

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

  const handleDelete = () => {
    Alert.alert(
      'Delete Photo Key',
      `Are you sure you want to delete "${photoKey?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            bottomSheetRef.current?.dismiss();
            onDelete();
          },
        },
      ]
    );
  };

  if (!photoKey) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: colors.cardBackground }}
      handleIndicatorStyle={{ backgroundColor: colors.icon }}
    >
      <BottomSheetView style={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          Edit Key
        </ThemedText>

        <View style={styles.keyName}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <ThemedText type="default">{photoKey.name}</ThemedText>
        </View>

        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            { backgroundColor: colors.error },
            pressed && { opacity: 0.7 },
          ]}
        >
          <ThemedText style={[styles.deleteButtonText, { color: '#FFFFFF' }]}>
            Remove Photo Key
          </ThemedText>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export const EditKeyModal = forwardRef<EditKeyModalRef, EditKeyModalProps>(EditKeyModalComponent);

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  keyName: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 'auto',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
