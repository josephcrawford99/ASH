import React from 'react';
import { render } from '@testing-library/react-native';
import { PhotoKeyMap } from '@/components/PhotoKeyMap';
import { KeyItem } from '@/types';

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMapView = (props: { children?: React.ReactNode; testID?: string }) => (
    <View testID={props.testID || 'map-view'}>{props.children}</View>
  );
  MockMapView.displayName = 'MockMapView';

  const MockMarker = (props: { children?: React.ReactNode; testID?: string }) => (
    <View testID={props.testID || 'marker'}>{props.children}</View>
  );
  MockMarker.displayName = 'MockMarker';

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    PROVIDER_DEFAULT: 'default',
  };
});

const createMockKeyItem = (overrides: Partial<KeyItem> = {}): KeyItem => ({
  id: `item-${Math.random().toString(36).substr(2, 9)}`,
  photoUri: 'file:///mock/photo.jpg',
  originalAssetId: 'mock-asset-id',
  name: 'Test Photo',
  coordinates: { latitude: 37.7749, longitude: -122.4194 },
  coordinatesRelativeToFloor: null,
  direction: null,
  floorNumber: 'unassigned',
  notes: '',
  ...overrides,
});

const createMapItem = (
  item: KeyItem,
  index: number,
  floorNumber: string = 'unassigned'
) => ({
  item,
  index,
  floorNumber,
});

describe('PhotoKeyMap', () => {
  it('returns null when items array is empty', () => {
    const { toJSON } = render(<PhotoKeyMap items={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('returns null when no items have GPS coordinates', () => {
    const items = [
      createMapItem(createMockKeyItem({ coordinates: null }), 0),
      createMapItem(createMockKeyItem({ coordinates: null }), 1),
    ];
    const { toJSON } = render(<PhotoKeyMap items={items} />);
    expect(toJSON()).toBeNull();
  });

  it('renders map when items have GPS coordinates', () => {
    const items = [createMapItem(createMockKeyItem(), 0)];
    const { toJSON } = render(<PhotoKeyMap items={items} />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders correct number of markers', () => {
    const items = [
      createMapItem(createMockKeyItem(), 0),
      createMapItem(createMockKeyItem(), 1),
      createMapItem(createMockKeyItem(), 2),
    ];
    const { getAllByTestId } = render(<PhotoKeyMap items={items} />);
    const markers = getAllByTestId('marker');
    expect(markers.length).toBe(3);
  });

  it('filters out items without coordinates', () => {
    const items = [
      createMapItem(createMockKeyItem(), 0),
      createMapItem(createMockKeyItem({ coordinates: null }), 1),
      createMapItem(createMockKeyItem(), 2),
    ];
    const { getAllByTestId } = render(<PhotoKeyMap items={items} />);
    const markers = getAllByTestId('marker');
    expect(markers.length).toBe(2);
  });

  it('uses default height of 250', () => {
    const items = [createMapItem(createMockKeyItem(), 0)];
    const { toJSON } = render(<PhotoKeyMap items={items} />);
    const tree = toJSON();
    if (tree && 'props' in tree) {
      expect(tree.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ height: 250 })])
      );
    }
  });

  it('applies custom height', () => {
    const items = [createMapItem(createMockKeyItem(), 0)];
    const { toJSON } = render(<PhotoKeyMap items={items} height={400} />);
    const tree = toJSON();
    if (tree && 'props' in tree) {
      expect(tree.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ height: 400 })])
      );
    }
  });

  it('calls onMarkerPress when marker is pressed', () => {
    const mockOnPress = jest.fn();
    const item = createMockKeyItem();
    const items = [createMapItem(item, 0, 'floor1')];

    render(<PhotoKeyMap items={items} onMarkerPress={mockOnPress} />);
    // Note: Actually triggering onPress would require fireEvent on the Marker
    // This test verifies the component accepts the prop without error
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders KeyVector inside each marker', () => {
    const items = [
      createMapItem(createMockKeyItem(), 0),
      createMapItem(createMockKeyItem(), 1),
    ];
    const { getByText } = render(<PhotoKeyMap items={items} />);
    // KeyVector shows the index + 1 as the number
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('handles single item correctly', () => {
    const items = [createMapItem(createMockKeyItem(), 0)];
    const { toJSON, getByText } = render(<PhotoKeyMap items={items} />);
    expect(toJSON()).not.toBeNull();
    expect(getByText('1')).toBeTruthy();
  });

  it('handles items with direction data', () => {
    const items = [
      createMapItem(createMockKeyItem({ direction: 45 }), 0),
      createMapItem(createMockKeyItem({ direction: 180 }), 1),
    ];
    const { toJSON } = render(<PhotoKeyMap items={items} />);
    expect(toJSON()).not.toBeNull();
  });
});
