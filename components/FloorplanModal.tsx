import { useCallback, useMemo, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { ThemedText } from './ThemedText';
import { FloorKey, FloorKeyVector } from './FloorKey';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { Floorplan } from '@/types';

interface FloorplanModalProps {
  floorNumber: string;
  floorplan: Floorplan | null;
  vectors?: FloorKeyVector[]; // Vectors to show on preview
  onPickImage: () => void;
  onAdjustPosition?: () => void;
  onDismiss?: () => void;
}

export interface FloorplanModalRef {
  present: () => void;
  dismiss: () => void;
}

function FloorplanModalComponent(
  { floorNumber, floorplan, vectors = [], onPickImage, onAdjustPosition, onDismiss }: FloorplanModalProps,
  ref: React.ForwardedRef<FloorplanModalRef>
) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [imageError, setImageError] = useState(false);

  const snapPoints = useMemo(() => ['60%'], []);

  // Check if floorplan has been positioned (has non-default coordinates)
  const hasPosition = useMemo(() => {
    if (!floorplan) return false;
    return (
      floorplan.centerCoordinates.latitude !== 0 &&
      floorplan.centerCoordinates.longitude !== 0 &&
      floorplan.scale > 0
    );
  }, [floorplan]);

  // Preview width (with padding)
  const previewWidth = screenWidth - Spacing.lg * 4;

  // Reset image error when floorplan changes
  useEffect(() => {
    setImageError(false);
  }, [floorplan?.imageUri]);

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

  const handlePickImage = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    // Small delay to let the modal dismiss before opening picker
    setTimeout(() => {
      onPickImage();
    }, 300);
  }, [onPickImage]);

  const handleAdjustPosition = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    // Small delay to let the modal dismiss before opening adjustment view
    setTimeout(() => {
      onAdjustPosition?.();
    }, 300);
  }, [onAdjustPosition]);

  const title = `Floor ${floorNumber} Floorplan`;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: colors.cardBackground }}
      handleIndicatorStyle={{ backgroundColor: colors.icon }}
      onDismiss={onDismiss}
    >
      <BottomSheetScrollView style={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>

        {floorplan ? (
          imageError ? (
            <View style={[styles.image, styles.errorPlaceholder]}>
              <Ionicons name="image-outline" size={48} color={colors.icon} />
              <ThemedText style={[styles.errorText, { color: colors.icon }]}>
                Image unavailable
              </ThemedText>
            </View>
          ) : hasPosition && vectors.length > 0 ? (
            <View style={[styles.previewContainer, { borderRadius: BorderRadius.md }]}>
              <FloorKey
                floorplan={floorplan}
                vectors={vectors}
                width={previewWidth}
                vectorSize={28}
                floorplanOpacity={1}
                interactive={false}
              />
            </View>
          ) : (
            <Image
              source={{ uri: floorplan.imageUri }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          )
        ) : (
          <View style={[styles.image, styles.emptyPlaceholder]}>
            <Ionicons name="map-outline" size={48} color={colors.icon} />
            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
              No floorplan image
            </ThemedText>
          </View>
        )}

        <View style={styles.actions}>
          {floorplan && onAdjustPosition && (
            <Pressable
              onPress={handleAdjustPosition}
              style={({ pressed }) => [
                styles.pickButton,
                { backgroundColor: colors.text },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="move" size={20} color={colors.background} style={styles.buttonIcon} />
              <ThemedText style={[styles.pickButtonText, { color: colors.background }]}>
                Adjust Position
              </ThemedText>
            </Pressable>
          )}
          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: colors.text },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="image" size={20} color={colors.text} style={styles.buttonIcon} />
            <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>
              {floorplan ? 'Replace Image' : 'Pick Image'}
            </ThemedText>
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export const FloorplanModal = forwardRef<FloorplanModalRef, FloorplanModalProps>(FloorplanModalComponent);

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
    height: 250,
    borderRadius: BorderRadius.md,
    backgroundColor: '#333',
    marginBottom: Spacing.lg,
  },
  errorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
  },
  emptyPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
  },
  actions: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  pickButton: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  pickButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    alignSelf: 'center',
  },
});
