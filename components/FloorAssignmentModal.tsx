import { useCallback, useMemo, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

interface FloorAssignmentModalProps {
  photoCount: number;
  onConfirm: (floorNumber: string) => void;
  onDismiss: () => void;
}

export interface FloorAssignmentModalRef {
  present: () => void;
  dismiss: () => void;
}

function FloorAssignmentModalComponent(
  { photoCount, onConfirm, onDismiss }: FloorAssignmentModalProps,
  ref: React.ForwardedRef<FloorAssignmentModalRef>
) {
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [floorInput, setFloorInput] = useState('');

  const snapPoints = useMemo(() => ['30%'], []);

  // Reset input when modal is presented
  useEffect(() => {
    if (photoCount > 0) {
      setFloorInput('');
    }
  }, [photoCount]);

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
        pressBehavior="close"
      />
    ),
    []
  );

  const handleConfirm = useCallback(() => {
    const floor = floorInput.trim() || 'unassigned';
    bottomSheetRef.current?.dismiss();
    onConfirm(floor);
  }, [floorInput, onConfirm]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: colors.cardBackground }}
      handleIndicatorStyle={{ backgroundColor: colors.icon }}
      onDismiss={handleDismiss}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          Assign Floor
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {photoCount} {photoCount === 1 ? 'photo' : 'photos'} selected
        </ThemedText>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Floor Number</ThemedText>
          <BottomSheetTextInput
            value={floorInput}
            onChangeText={setFloorInput}
            style={[styles.floorInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Leave empty for unassigned"
            placeholderTextColor={colors.icon}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />
        </View>

        <Pressable
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.confirmButton,
            { backgroundColor: colors.text },
            pressed && { opacity: 0.7 },
          ]}
        >
          <ThemedText style={[styles.confirmButtonText, { color: colors.background }]}>
            Add Photos
          </ThemedText>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export const FloorAssignmentModal = forwardRef<FloorAssignmentModalRef, FloorAssignmentModalProps>(
  FloorAssignmentModalComponent
);

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  floorInput: {
    fontFamily: Fonts.primary.regular,
    fontSize: 16,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  confirmButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 'auto',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
