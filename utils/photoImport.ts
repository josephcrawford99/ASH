import * as ImagePicker from 'expo-image-picker';
import { KeyItem, Coordinates } from '@/types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface PhotoImportResult {
  success: boolean;
  items: KeyItem[];
  error?: string;
}

function extractFilename(uri: string): string {
  const parts = uri.split('/');
  const filename = parts[parts.length - 1];
  // Remove query params if any
  return filename.split('?')[0];
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function pickAndImportPhotos(): Promise<PhotoImportResult> {
  try {
    // Request permission first
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      return {
        success: false,
        items: [],
        error: 'Photo library permission denied',
      };
    }

    // Open picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
      exif: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: true,
        items: [],
      };
    }

    const items: KeyItem[] = [];

    for (const asset of result.assets) {
      const id = generateId();
      const originalFilename = extractFilename(asset.uri);

      // Use the picker URI directly (no copying)
      const photoUri = asset.uri;

      // Get EXIF data from picker result
      let coordinates: Coordinates | null = null;
      let direction: number | null = null;

      if (asset.exif) {
        const exif = asset.exif as Record<string, unknown>;

        // Get GPS coordinates from EXIF
        if (typeof exif.GPSLatitude === 'number' && typeof exif.GPSLongitude === 'number') {
          let latitude = exif.GPSLatitude;
          let longitude = exif.GPSLongitude;

          // Apply reference direction (N/S, E/W)
          if (exif.GPSLatitudeRef === 'S') {
            latitude = -latitude;
          }
          if (exif.GPSLongitudeRef === 'W') {
            longitude = -longitude;
          }

          coordinates = { latitude, longitude };
        }

        // Get compass direction
        if (typeof exif.GPSImgDirection === 'number') {
          direction = exif.GPSImgDirection;
        }
      }

      const keyItem: KeyItem = {
        id,
        photoUri,
        originalAssetId: asset.assetId || '',
        coordinates,
        coordinatesRelativeToFloor: null,
        direction,
        floorNumber: 'unassigned',
        name: originalFilename.replace(/\.[^.]+$/, ''), // Remove extension
        notes: '',
      };

      items.push(keyItem);
    }

    return {
      success: true,
      items,
    };
  } catch (error) {
    console.error('Photo import error:', error);
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
