import * as ImagePicker from 'expo-image-picker';

export interface PhotoData {
  // Photo data
  asset: ImagePicker.ImagePickerAsset;
  note: string;
  floor?: number;
  index: number;
  timestamp: number;

  // Pre-computed marker data
  latitude: number | null;
  longitude: number | null;
  direction: number;
  hasGPS: boolean;
}
