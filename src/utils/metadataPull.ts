import * as ImagePicker from 'expo-image-picker';
import { PhotoData } from '../types/photo';

export function processImagePickerAssets(assets: ImagePicker.ImagePickerAsset[]): PhotoData[] {
  return assets.map((asset, index) => {
    let latitude: number | null = null;
    let longitude: number | null = null;
    let direction = 0;
    let hasGPS = false;

    if (asset.exif?.GPSLatitude && asset.exif?.GPSLongitude) {
      hasGPS = true;
      latitude = asset.exif.GPSLatitude;
      longitude = asset.exif.GPSLongitude;

      if (asset.exif?.GPSLatitudeRef === 'S' && latitude !== null) {
        latitude = -latitude;
      }
      if (asset.exif?.GPSLongitudeRef === 'W' && longitude !== null) {
        longitude = -longitude;
      }

      direction = asset.exif?.GPSImgDirection || 0;
    }

    return {
      asset,
      note: '',
      index: index + 1,
      timestamp: Date.now(),
      latitude,
      longitude,
      direction,
      hasGPS,
    };
  });
}
