import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { FloorplanCapture } from './FloorplanCapture';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { PhotoKey, Floorplan } from '@/types';
import { exportPhotoKeyToPdfWithCaptures, loadVectorAsset } from '@/utils/pdfExport';

// Convert file:// URI to base64 data URI
async function convertToDataUri(uri: string): Promise<string | null> {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { base64: true, format: SaveFormat.PNG, compress: 1.0 }
    );
    return result.base64 ? `data:image/png;base64,${result.base64}` : null;
  } catch (error) {
    console.warn('Failed to convert image to base64:', error);
    return null;
  }
}

interface PdfExportContainerProps {
  photoKey: PhotoKey;
  visible: boolean;
  onComplete: (success: boolean, error?: string) => void;
}

// Floorplan with base64 data URI instead of file:// URI
interface ConvertedFloorplan extends Omit<Floorplan, 'imageUri'> {
  imageUri: string; // Now contains data:image/png;base64,...
}

export function PdfExportContainer({
  photoKey,
  visible,
  onComplete,
}: PdfExportContainerProps) {
  const { colors } = useTheme();
  // Floor intro captures (all vectors on floor)
  const [floorIntroCaptured, setFloorIntroCaptured] = useState<Record<string, string>>({});
  // Individual item captures (single vector)
  const [itemCaptured, setItemCaptured] = useState<Record<string, string>>({});
  const [convertedFloorplans, setConvertedFloorplans] = useState<Record<string, ConvertedFloorplan>>({});
  const [vectorBase64, setVectorBase64] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [pendingFloorIntros, setPendingFloorIntros] = useState(-1);
  const [pendingItems, setPendingItems] = useState(-1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get floors that need capturing (have floorplan and items)
  const floorsToCapture = useMemo(() => {
    return Object.entries(photoKey.floors)
      .filter(
        ([num, floor]) =>
          num !== 'unassigned' && floor.floorplan && floor.keyitems.length > 0
      )
      .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10));
  }, [photoKey.floors]);

  // Get individual items that need captures (have coordinates on a floor with floorplan)
  const itemsToCapture = useMemo(() => {
    const items: { floorNum: string; itemId: string; itemIndex: number }[] = [];
    let idx = 0;

    const sortedFloors = Object.entries(photoKey.floors).sort(([a], [b]) => {
      if (a === 'unassigned') return 1;
      if (b === 'unassigned') return -1;
      return parseInt(a, 10) - parseInt(b, 10);
    });

    for (const [floorNum, floor] of sortedFloors) {
      for (const item of floor.keyitems) {
        // Only capture items that have coordinates AND are on a floor with a floorplan
        if (floorNum !== 'unassigned' && floor.floorplan && item.coordinates) {
          items.push({ floorNum, itemId: item.id, itemIndex: idx });
        }
        idx++;
      }
    }
    return items;
  }, [photoKey.floors]);

  // Calculate global indices for all items
  const itemIndices = useMemo(() => {
    const indices = new Map<string, number>();
    let idx = 0;

    const sortedFloors = Object.entries(photoKey.floors).sort(([a], [b]) => {
      if (a === 'unassigned') return 1;
      if (b === 'unassigned') return -1;
      return parseInt(a, 10) - parseInt(b, 10);
    });

    for (const [, floor] of sortedFloors) {
      for (const item of floor.keyitems) {
        indices.set(item.id, idx++);
      }
    }
    return indices;
  }, [photoKey.floors]);

  // Phase 1: Convert all floorplan URIs to base64 data URIs AND load vector asset
  useEffect(() => {
    if (!visible || isConverting || isGenerating || pendingFloorIntros !== -1) return;

    // No floors to capture - proceed directly to PDF generation
    if (floorsToCapture.length === 0) {
      setIsGenerating(true);
      exportPhotoKeyToPdfWithCaptures(photoKey, {}, {})
        .then((result) => {
          onComplete(result.success, result.error);
        })
        .catch((error) => {
          onComplete(false, error instanceof Error ? error.message : 'Export failed');
        });
      return;
    }

    setIsConverting(true);

    const convertAll = async () => {
      // Load vector asset (for KeyVector markers)
      const vectorData = await loadVectorAsset();
      setVectorBase64(vectorData);

      // Convert all floorplan URIs to base64
      const converted: Record<string, ConvertedFloorplan> = {};

      for (const [floorNum, floor] of floorsToCapture) {
        if (floor.floorplan) {
          const dataUri = await convertToDataUri(floor.floorplan.imageUri);
          if (dataUri) {
            converted[floorNum] = {
              ...floor.floorplan,
              imageUri: dataUri,
            };
          }
        }
      }

      const convertedCount = Object.keys(converted).length;

      setConvertedFloorplans(converted);
      setPendingFloorIntros(convertedCount);
      setPendingItems(itemsToCapture.length);
      setIsConverting(false);
    };

    convertAll();
  }, [visible, isConverting, isGenerating, pendingFloorIntros, floorsToCapture, itemsToCapture.length, photoKey, onComplete]);

  // Reset state when becoming visible
  useEffect(() => {
    if (visible) {
      setFloorIntroCaptured({});
      setItemCaptured({});
      setConvertedFloorplans({});
      setVectorBase64(null);
      setPendingFloorIntros(-1);
      setPendingItems(-1);
      setIsGenerating(false);
      setIsConverting(false);
    }
  }, [visible]);

  // Handle floor intro capture completion
  const handleFloorIntroCapture = useCallback((floorNumber: string, base64: string) => {
    if (base64 && base64.length > 0) {
      setFloorIntroCaptured((prev) => ({ ...prev, [floorNumber]: base64 }));
    }
    setPendingFloorIntros((prev) => prev - 1);
  }, []);

  // Handle individual item capture completion
  const handleItemCapture = useCallback((itemId: string, base64: string) => {
    if (base64 && base64.length > 0) {
      setItemCaptured((prev) => ({ ...prev, [itemId]: base64 }));
    }
    setPendingItems((prev) => prev - 1);
  }, []);

  // When all captures done, generate PDF
  useEffect(() => {
    if (!visible || isGenerating) return;

    // All captures complete (both floor intros and individual items)
    if (pendingFloorIntros === 0 && pendingItems === 0) {
      setIsGenerating(true);
      exportPhotoKeyToPdfWithCaptures(photoKey, floorIntroCaptured, itemCaptured)
        .then((result) => {
          onComplete(result.success, result.error);
        })
        .catch((error) => {
          onComplete(false, error instanceof Error ? error.message : 'Export failed');
        });
    }
  }, [visible, pendingFloorIntros, pendingItems, isGenerating, photoKey, floorIntroCaptured, itemCaptured, onComplete]);

  if (!visible) {
    return null;
  }

  // Get status text
  const getStatusText = () => {
    if (isConverting) {
      return 'Loading floorplans...';
    }
    const totalFloorIntros = Object.keys(convertedFloorplans).length;
    const totalItems = itemsToCapture.length;
    const doneFloorIntros = totalFloorIntros - Math.max(0, pendingFloorIntros);
    const doneItems = totalItems - Math.max(0, pendingItems);

    if (pendingFloorIntros > 0 || pendingItems > 0) {
      return `Capturing... (${doneFloorIntros + doneItems}/${totalFloorIntros + totalItems})`;
    }
    return 'Generating PDF...';
  };

  // Check if we're ready to render capture views (conversion done, vector loaded)
  const readyToCapture = !isConverting && vectorBase64 && Object.keys(convertedFloorplans).length > 0;

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      <View style={[styles.statusContainer, { backgroundColor: colors.cardBackground }]}>
        <ActivityIndicator size="large" color={colors.text} />
        <ThemedText style={styles.statusText}>{getStatusText()}</ThemedText>
      </View>

      {/* Capture views - rendered on screen temporarily for capture */}
      {readyToCapture && (
        <View style={styles.captureContainer}>
          {/* Floor intro captures (all vectors on floor) */}
          {Object.entries(convertedFloorplans).map(([floorNum, floorplan]) => {
            const floor = photoKey.floors[floorNum];
            const vectors = floor.keyitems
              .filter((item) => item.coordinates !== null)
              .map((item) => ({
                id: item.id,
                number: (itemIndices.get(item.id) ?? 0) + 1,
                direction: item.direction,
                coordinates: item.coordinates!,
              }));

            return (
              <FloorplanCapture
                key={`floor-${floorNum}`}
                floorplan={floorplan}
                vectors={vectors}
                vectorBase64={vectorBase64}
                width={600}
                height={600}
                vectorSize={40}
                onCapture={(base64) => handleFloorIntroCapture(floorNum, base64)}
              />
            );
          })}

          {/* Individual item captures (single vector each) */}
          {itemsToCapture.map(({ floorNum, itemId, itemIndex }) => {
            const floorplan = convertedFloorplans[floorNum];
            if (!floorplan) return null;

            const floor = photoKey.floors[floorNum];
            const item = floor.keyitems.find((i) => i.id === itemId);
            if (!item || !item.coordinates) return null;

            const singleVector = [{
              id: item.id,
              number: itemIndex + 1,
              direction: item.direction,
              coordinates: item.coordinates,
            }];

            return (
              <FloorplanCapture
                key={`item-${itemId}`}
                floorplan={floorplan}
                vectors={singleVector}
                vectorBase64={vectorBase64}
                width={400}
                height={400}
                vectorSize={32}
                onCapture={(base64) => handleItemCapture(itemId, base64)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  statusContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
  },
  captureContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0, // Hidden but still rendered - captureRef can capture opacity:0 views
  },
});
