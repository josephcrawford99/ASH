/**
 * Tests for photo import functionality
 */
import * as ImagePicker from 'expo-image-picker';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

// Import after mocking
import { pickAndImportPhotos, requestMediaLibraryPermission, pickFloorplanImage } from '@/utils/photoImport';

describe('requestMediaLibraryPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when permission is granted', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });

    const result = await requestMediaLibraryPermission();
    expect(result).toBe(true);
    expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('returns false when permission is denied', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const result = await requestMediaLibraryPermission();
    expect(result).toBe(false);
  });

  it('returns false when permission is undetermined', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
    });

    const result = await requestMediaLibraryPermission();
    expect(result).toBe(false);
  });
});

describe('pickAndImportPhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error when permission is denied', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const result = await pickAndImportPhotos();

    expect(result.success).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.error).toBe('Photo library permission denied');
  });

  it('returns empty items when user cancels picker', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null,
    });

    const result = await pickAndImportPhotos();

    expect(result.success).toBe(true);
    expect(result.items).toEqual([]);
    expect(result.error).toBeUndefined();
  });

  it('imports single photo without EXIF data', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///test/photo1.jpg',
          assetId: 'asset-123',
          exif: null,
        },
      ],
    });

    const result = await pickAndImportPhotos();

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].photoUri).toBe('file:///test/photo1.jpg');
    expect(result.items[0].originalAssetId).toBe('asset-123');
    expect(result.items[0].coordinates).toBeNull();
    expect(result.items[0].direction).toBeNull();
    expect(result.items[0].floorNumber).toBe('unassigned');
    expect(result.items[0].name).toBe('photo1');
  });

  it('extracts GPS coordinates from EXIF data', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///test/geotagged.jpg',
          assetId: 'asset-456',
          exif: {
            GPSLatitude: 40.7128,
            GPSLongitude: 74.0060,
            GPSLatitudeRef: 'N',
            GPSLongitudeRef: 'W',
          },
        },
      ],
    });

    const result = await pickAndImportPhotos();

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].coordinates).toEqual({
      latitude: 40.7128,
      longitude: -74.0060, // Negative because GPSLongitudeRef is 'W'
    });
  });

  it('applies South latitude reference correctly', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///test/sydney.jpg',
          assetId: 'asset-789',
          exif: {
            GPSLatitude: 33.8688,
            GPSLongitude: 151.2093,
            GPSLatitudeRef: 'S',
            GPSLongitudeRef: 'E',
          },
        },
      ],
    });

    const result = await pickAndImportPhotos();

    expect(result.items[0].coordinates).toEqual({
      latitude: -33.8688, // Negative because GPSLatitudeRef is 'S'
      longitude: 151.2093,
    });
  });

  it('extracts compass direction from EXIF data', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///test/compass.jpg',
          assetId: 'asset-dir',
          exif: {
            GPSImgDirection: 135.5,
          },
        },
      ],
    });

    const result = await pickAndImportPhotos();

    expect(result.items[0].direction).toBe(135.5);
  });

  it('imports multiple photos at once', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///test/photo1.jpg', assetId: 'a1', exif: null },
        { uri: 'file:///test/photo2.jpg', assetId: 'a2', exif: null },
        { uri: 'file:///test/photo3.jpg', assetId: 'a3', exif: null },
      ],
    });

    const result = await pickAndImportPhotos();

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].name).toBe('photo1');
    expect(result.items[1].name).toBe('photo2');
    expect(result.items[2].name).toBe('photo3');
  });

  it('generates unique IDs for each photo', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///test/photo1.jpg', assetId: 'a1', exif: null },
        { uri: 'file:///test/photo2.jpg', assetId: 'a2', exif: null },
      ],
    });

    const result = await pickAndImportPhotos();

    expect(result.items[0].id).not.toBe(result.items[1].id);
    // Check UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(result.items[0].id).toMatch(uuidPattern);
    expect(result.items[1].id).toMatch(uuidPattern);
  });

  it('strips file extension from photo name', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///test/IMG_1234.HEIC', assetId: 'a1', exif: null },
        { uri: 'file:///test/vacation-photo.jpeg', assetId: 'a2', exif: null },
      ],
    });

    const result = await pickAndImportPhotos();

    expect(result.items[0].name).toBe('IMG_1234');
    expect(result.items[1].name).toBe('vacation-photo');
  });

  it('initializes coordinatesRelativeToFloor as null', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///test/photo.jpg', assetId: 'a1', exif: null },
      ],
    });

    const result = await pickAndImportPhotos();

    expect(result.items[0].coordinatesRelativeToFloor).toBeNull();
  });

  it('initializes notes as empty string', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///test/photo.jpg', assetId: 'a1', exif: null },
      ],
    });

    const result = await pickAndImportPhotos();

    expect(result.items[0].notes).toBe('');
  });

  it('handles empty assetId gracefully', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///test/photo.jpg', assetId: undefined, exif: null },
      ],
    });

    const result = await pickAndImportPhotos();

    expect(result.items[0].originalAssetId).toBe('');
  });
});

describe('pickFloorplanImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error when permission is denied', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const result = await pickFloorplanImage('1', null);

    expect(result.success).toBe(false);
    expect(result.floorplan).toBeUndefined();
    expect(result.error).toBe('Photo library permission denied');
  });

  it('returns success without floorplan when user cancels', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null,
    });

    const result = await pickFloorplanImage('1', null);

    expect(result.success).toBe(true);
    expect(result.floorplan).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('creates floorplan with default coordinates when none provided', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///test/floorplan.png' },
      ],
    });

    const result = await pickFloorplanImage('2', null);

    expect(result.success).toBe(true);
    expect(result.floorplan).toBeDefined();
    expect(result.floorplan?.centerCoordinates).toEqual({ latitude: 0, longitude: 0 });
    expect(result.floorplan?.floorNumber).toBe('2');
    expect(result.floorplan?.scale).toBe(1.0);
    expect(result.floorplan?.rotation).toBe(0);
  });

  it('uses provided center coordinates', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///test/floorplan.png' },
      ],
    });

    const centerCoords = { latitude: 42.3601, longitude: -71.0589 };
    const result = await pickFloorplanImage('1', centerCoords);

    expect(result.floorplan?.centerCoordinates).toEqual(centerCoords);
  });

  it('generates unique ID for floorplan', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///test/floorplan.png' },
      ],
    });

    const result = await pickFloorplanImage('1', null);

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(result.floorplan?.id).toMatch(uuidPattern);
  });
});
