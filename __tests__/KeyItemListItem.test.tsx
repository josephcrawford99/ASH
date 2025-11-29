/**
 * Tests for KeyItemListItem component
 *
 * Tests the display of photo metadata in the list view,
 * including coordinates display and graceful handling of missing data.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { KeyItemListItem } from '@/components/KeyItemListItem';
import { KeyItem } from '@/types';

// Mock useTheme and useThemeColor hooks
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      text: '#1A1A1A',
      background: '#FAFAFA',
      cardBackground: '#FFFFFF',
      highlight: '#F0F0F0',
      border: '#E0E0E0',
      icon: '#666666',
    },
  }),
  useThemeColor: () => '#1A1A1A',
}));

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

describe('KeyItemListItem', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Photo name display', () => {
    it('displays the photo name', () => {
      const item = createTestItem({ name: 'Living Room' });
      const { getByText } = render(
        <KeyItemListItem item={item} index={0} onPress={mockOnPress} />
      );

      expect(getByText('Living Room')).toBeTruthy();
    });

    it('displays different photo names correctly', () => {
      const item = createTestItem({ name: 'Kitchen Counter Shot' });
      const { getByText } = render(
        <KeyItemListItem item={item} index={0} onPress={mockOnPress} />
      );

      expect(getByText('Kitchen Counter Shot')).toBeTruthy();
    });
  });

  describe('Index display', () => {
    it('displays index + 1 (1-based numbering)', () => {
      const item = createTestItem();
      const { getByText } = render(
        <KeyItemListItem item={item} index={0} onPress={mockOnPress} />
      );

      expect(getByText('1')).toBeTruthy();
    });

    it('displays correct number for different indices', () => {
      const item = createTestItem();
      const { getByText } = render(
        <KeyItemListItem item={item} index={4} onPress={mockOnPress} />
      );

      expect(getByText('5')).toBeTruthy();
    });
  });

  describe('Coordinates display', () => {
    it('shows "No location data" when coordinates are null', () => {
      const item = createTestItem({ coordinates: null });
      const { getByText } = render(
        <KeyItemListItem item={item} index={0} onPress={mockOnPress} />
      );

      expect(getByText('No location data')).toBeTruthy();
    });

    it('displays coordinates when available', () => {
      const item = createTestItem({
        coordinates: { latitude: 40.712800, longitude: -74.006000 },
      });
      const { getByText } = render(
        <KeyItemListItem item={item} index={0} onPress={mockOnPress} />
      );

      expect(getByText('40.712800, -74.006000')).toBeTruthy();
    });

    it('formats coordinates to 6 decimal places', () => {
      const item = createTestItem({
        coordinates: { latitude: 51.5073509, longitude: -0.1277583 },
      });
      const { getByText } = render(
        <KeyItemListItem item={item} index={0} onPress={mockOnPress} />
      );

      expect(getByText('51.507351, -0.127758')).toBeTruthy();
    });

    it('handles negative coordinates (southern/western hemispheres)', () => {
      const item = createTestItem({
        coordinates: { latitude: -33.8688, longitude: 151.2093 },
      });
      const { getByText } = render(
        <KeyItemListItem item={item} index={0} onPress={mockOnPress} />
      );

      expect(getByText('-33.868800, 151.209300')).toBeTruthy();
    });

    it('handles coordinates at origin (0, 0)', () => {
      const item = createTestItem({
        coordinates: { latitude: 0, longitude: 0 },
      });
      const { getByText } = render(
        <KeyItemListItem item={item} index={0} onPress={mockOnPress} />
      );

      expect(getByText('0.000000, 0.000000')).toBeTruthy();
    });
  });

  describe('Press handling', () => {
    it('calls onPress when pressed', () => {
      const item = createTestItem();
      const { getByText } = render(
        <KeyItemListItem item={item} index={0} onPress={mockOnPress} />
      );

      fireEvent.press(getByText('Test Photo'));

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple items rendering', () => {
    it('renders correctly with coordinates', () => {
      const item = createTestItem({
        name: 'Photo With GPS',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
      });
      const { getByText, queryByText } = render(
        <KeyItemListItem item={item} index={2} onPress={mockOnPress} />
      );

      expect(getByText('3')).toBeTruthy(); // Index
      expect(getByText('Photo With GPS')).toBeTruthy(); // Name
      expect(getByText('37.774900, -122.419400')).toBeTruthy(); // Coordinates
      expect(queryByText('No location data')).toBeNull(); // Should NOT show no location
    });

    it('renders correctly without coordinates', () => {
      const item = createTestItem({
        name: 'Screenshot',
        coordinates: null,
      });
      const { getByText, queryByText } = render(
        <KeyItemListItem item={item} index={0} onPress={mockOnPress} />
      );

      expect(getByText('1')).toBeTruthy(); // Index
      expect(getByText('Screenshot')).toBeTruthy(); // Name
      expect(getByText('No location data')).toBeTruthy(); // No location message
      expect(queryByText(/\d+\.\d+, -?\d+\.\d+/)).toBeNull(); // Should NOT show coordinates
    });
  });
});
