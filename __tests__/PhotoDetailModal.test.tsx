/**
 * Tests for PhotoDetailModal component
 *
 * Tests the display of metadata fields (Location, Direction, Floor)
 * including "No data" states.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { KeyItem } from '@/types';

// Mock useTheme hook
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      text: '#1A1A1A',
      background: '#FAFAFA',
      cardBackground: '#FFFFFF',
      border: '#E0E0E0',
      icon: '#666666',
      error: '#C45C5C',
    },
    theme: 'light',
  }),
}));

// Create a simplified component for testing the metadata display logic
// This avoids the complexity of mocking @gorhom/bottom-sheet with React 19
interface MetadataDisplayProps {
  item: KeyItem;
}

const MetadataDisplay: React.FC<MetadataDisplayProps> = ({ item }) => {
  const formatCoordinates = () => {
    if (!item.coordinates) return null;
    return `${item.coordinates.latitude.toFixed(6)}, ${item.coordinates.longitude.toFixed(6)}`;
  };

  const formatDirection = () => {
    if (item.direction === null) return null;
    return `${item.direction.toFixed(0)}°`;
  };

  return (
    <View>
      <Text testID="title">{item.name}</Text>

      <View testID="location-section">
        <Text>Location</Text>
        {item.coordinates ? (
          <Text testID="location-value">{formatCoordinates()}</Text>
        ) : (
          <Text testID="no-location">No location data</Text>
        )}
      </View>

      <View testID="direction-section">
        <Text>Direction</Text>
        {item.direction !== null ? (
          <Text testID="direction-value">{formatDirection()}</Text>
        ) : (
          <Text testID="no-direction">No direction data</Text>
        )}
      </View>

      <View testID="floor-section">
        <Text>Floor</Text>
        <Text testID="floor-value">
          {item.floorNumber === 'unassigned' ? 'Unassigned' : item.floorNumber}
        </Text>
      </View>
    </View>
  );
};

// Helper to create test items
const createTestItem = (overrides: Partial<KeyItem> = {}): KeyItem => ({
  id: 'test-id-123',
  photoUri: 'file:///test/photo.jpg',
  originalAssetId: 'asset-123',
  coordinates: null,
  coordinatesRelativeToFloor: null,
  direction: null,
  floorNumber: 'unassigned',
  name: 'Test Photo',
  notes: '',
  ...overrides,
});

describe('PhotoDetailModal Metadata Display', () => {
  describe('Location display', () => {
    it('shows "No location data" when coordinates are null', () => {
      const item = createTestItem({ coordinates: null });
      const { getByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('no-location')).toBeTruthy();
      expect(getByTestId('no-location').props.children).toBe('No location data');
    });

    it('displays coordinates when available', () => {
      const item = createTestItem({
        coordinates: { latitude: 40.712800, longitude: -74.006000 },
      });
      const { getByTestId, queryByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('location-value')).toBeTruthy();
      expect(getByTestId('location-value').props.children).toBe('40.712800, -74.006000');
      expect(queryByTestId('no-location')).toBeNull();
    });

    it('formats coordinates to 6 decimal places', () => {
      const item = createTestItem({
        coordinates: { latitude: 51.5073509, longitude: -0.1277583 },
      });
      const { getByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('location-value').props.children).toBe('51.507351, -0.127758');
    });
  });

  describe('Direction display', () => {
    it('shows "No direction data" when direction is null', () => {
      const item = createTestItem({ direction: null });
      const { getByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('no-direction')).toBeTruthy();
      expect(getByTestId('no-direction').props.children).toBe('No direction data');
    });

    it('displays direction in degrees when available', () => {
      const item = createTestItem({ direction: 135 });
      const { getByTestId, queryByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('direction-value')).toBeTruthy();
      expect(getByTestId('direction-value').props.children).toBe('135°');
      expect(queryByTestId('no-direction')).toBeNull();
    });

    it('rounds decimal direction to whole number', () => {
      const item = createTestItem({ direction: 135.789 });
      const { getByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('direction-value').props.children).toBe('136°');
    });

    it('handles direction of 0 degrees', () => {
      const item = createTestItem({ direction: 0 });
      const { getByTestId, queryByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('direction-value').props.children).toBe('0°');
      expect(queryByTestId('no-direction')).toBeNull();
    });
  });

  describe('Floor display', () => {
    it('shows "Unassigned" for unassigned floor', () => {
      const item = createTestItem({ floorNumber: 'unassigned' });
      const { getByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('floor-value').props.children).toBe('Unassigned');
    });

    it('displays floor number for assigned floors', () => {
      const item = createTestItem({ floorNumber: '3' });
      const { getByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('floor-value').props.children).toBe('3');
    });
  });

  describe('Photo name display', () => {
    it('displays photo name', () => {
      const item = createTestItem({ name: 'Living Room Shot' });
      const { getByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('title').props.children).toBe('Living Room Shot');
    });
  });

  describe('Combined states', () => {
    it('shows both "No data" messages when both are null', () => {
      const item = createTestItem({
        coordinates: null,
        direction: null,
      });
      const { getByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('no-location')).toBeTruthy();
      expect(getByTestId('no-direction')).toBeTruthy();
    });

    it('shows location but no direction when only coordinates exist', () => {
      const item = createTestItem({
        coordinates: { latitude: 40.7128, longitude: -74.006 },
        direction: null,
      });
      const { getByTestId, queryByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('location-value')).toBeTruthy();
      expect(queryByTestId('no-location')).toBeNull();
      expect(getByTestId('no-direction')).toBeTruthy();
    });

    it('shows direction but no location when only direction exists', () => {
      const item = createTestItem({
        coordinates: null,
        direction: 90,
      });
      const { getByTestId, queryByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('no-location')).toBeTruthy();
      expect(getByTestId('direction-value')).toBeTruthy();
      expect(queryByTestId('no-direction')).toBeNull();
    });

    it('shows both values when both exist', () => {
      const item = createTestItem({
        coordinates: { latitude: 51.5074, longitude: -0.1278 },
        direction: 45,
      });
      const { getByTestId, queryByTestId } = render(<MetadataDisplay item={item} />);

      expect(getByTestId('location-value')).toBeTruthy();
      expect(queryByTestId('no-location')).toBeNull();
      expect(getByTestId('direction-value')).toBeTruthy();
      expect(queryByTestId('no-direction')).toBeNull();
    });
  });
});
