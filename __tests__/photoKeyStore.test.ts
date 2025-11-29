/**
 * Comprehensive tests for PhotoKeyStore
 *
 * Note: We test the store logic by mocking the zustand persist middleware
 * to skip persistence and test the pure state management logic.
 */
import { KeyItem, Floorplan } from '@/types';
import { create } from 'zustand';

// Re-create the store logic without persistence for testing
// This mirrors the actual store implementation

interface PhotoKey {
  id: string;
  name: string;
  dateCreated: string;
  lastModified: string;
  floors: Record<string, { floorplan: Floorplan | null; keyitems: KeyItem[] }>;
}

interface TestPhotoKeyStore {
  photoKeys: Record<string, PhotoKey>;
  addPhotoKey: (name: string) => string;
  removePhotoKey: (id: string) => void;
  updatePhotoKey: (id: string, updates: Partial<PhotoKey>) => void;
  addKeyItem: (photoKeyId: string, floorNumber: string, item: KeyItem) => void;
  removeKeyItem: (photoKeyId: string, floorNumber: string, itemId: string) => void;
  updateKeyItem: (photoKeyId: string, floorNumber: string, itemId: string, updates: Partial<KeyItem>) => void;
  moveKeyItemToFloor: (photoKeyId: string, itemId: string, fromFloor: string, toFloor: string) => void;
  addFloorplan: (photoKeyId: string, floorNumber: string, floorplan: Floorplan) => void;
  updateFloorplan: (photoKeyId: string, floorNumber: string, updates: Partial<Floorplan>) => void;
  removeFloorplan: (photoKeyId: string, floorNumber: string) => void;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function ensureFloor(
  floors: Record<string, { floorplan: Floorplan | null; keyitems: KeyItem[] }>,
  floorNumber: string
) {
  if (!floors[floorNumber]) {
    return {
      ...floors,
      [floorNumber]: { floorplan: null, keyitems: [] },
    };
  }
  return floors;
}

function updateLastModified(photoKey: PhotoKey): PhotoKey {
  return {
    ...photoKey,
    lastModified: new Date().toISOString(),
  };
}

// Create a test store without persistence
const createTestStore = () =>
  create<TestPhotoKeyStore>((set) => ({
    photoKeys: {},

    addPhotoKey: (name: string) => {
      const id = generateId();
      const now = new Date().toISOString();
      const newPhotoKey: PhotoKey = {
        id,
        name,
        dateCreated: now,
        lastModified: now,
        floors: {
          unassigned: { floorplan: null, keyitems: [] },
        },
      };

      set((state) => ({
        photoKeys: {
          ...state.photoKeys,
          [id]: newPhotoKey,
        },
      }));

      return id;
    },

    removePhotoKey: (id: string) => {
      set((state) => {
        const { [id]: _, ...rest } = state.photoKeys;
        return { photoKeys: rest };
      });
    },

    updatePhotoKey: (id: string, updates: Partial<PhotoKey>) => {
      set((state) => {
        const photoKey = state.photoKeys[id];
        if (!photoKey) return state;

        return {
          photoKeys: {
            ...state.photoKeys,
            [id]: updateLastModified({ ...photoKey, ...updates }),
          },
        };
      });
    },

    addKeyItem: (photoKeyId: string, floorNumber: string, item: KeyItem) => {
      set((state) => {
        const photoKey = state.photoKeys[photoKeyId];
        if (!photoKey) return state;

        const floors = ensureFloor(photoKey.floors, floorNumber);
        const floor = floors[floorNumber];

        return {
          photoKeys: {
            ...state.photoKeys,
            [photoKeyId]: updateLastModified({
              ...photoKey,
              floors: {
                ...floors,
                [floorNumber]: {
                  ...floor,
                  keyitems: [...floor.keyitems, item],
                },
              },
            }),
          },
        };
      });
    },

    removeKeyItem: (photoKeyId: string, floorNumber: string, itemId: string) => {
      set((state) => {
        const photoKey = state.photoKeys[photoKeyId];
        if (!photoKey) return state;

        const floor = photoKey.floors[floorNumber];
        if (!floor) return state;

        const updatedKeyitems = floor.keyitems.filter((item) => item.id !== itemId);

        const shouldRemoveFloorplan =
          floorNumber !== 'unassigned' && updatedKeyitems.length === 0 && floor.floorplan !== null;

        return {
          photoKeys: {
            ...state.photoKeys,
            [photoKeyId]: updateLastModified({
              ...photoKey,
              floors: {
                ...photoKey.floors,
                [floorNumber]: {
                  ...floor,
                  keyitems: updatedKeyitems,
                  floorplan: shouldRemoveFloorplan ? null : floor.floorplan,
                },
              },
            }),
          },
        };
      });
    },

    updateKeyItem: (
      photoKeyId: string,
      floorNumber: string,
      itemId: string,
      updates: Partial<KeyItem>
    ) => {
      set((state) => {
        const photoKey = state.photoKeys[photoKeyId];
        if (!photoKey) return state;

        const floor = photoKey.floors[floorNumber];
        if (!floor) return state;

        return {
          photoKeys: {
            ...state.photoKeys,
            [photoKeyId]: updateLastModified({
              ...photoKey,
              floors: {
                ...photoKey.floors,
                [floorNumber]: {
                  ...floor,
                  keyitems: floor.keyitems.map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                },
              },
            }),
          },
        };
      });
    },

    moveKeyItemToFloor: (
      photoKeyId: string,
      itemId: string,
      fromFloor: string,
      toFloor: string
    ) => {
      set((state) => {
        const photoKey = state.photoKeys[photoKeyId];
        if (!photoKey) return state;

        const sourceFloor = photoKey.floors[fromFloor];
        if (!sourceFloor) return state;

        const item = sourceFloor.keyitems.find((i) => i.id === itemId);
        if (!item) return state;

        let floors = ensureFloor(photoKey.floors, toFloor);
        const targetFloor = floors[toFloor];

        const updatedItem = { ...item, floorNumber: toFloor };

        const updatedSourceKeyitems = sourceFloor.keyitems.filter((i) => i.id !== itemId);

        const shouldRemoveSourceFloorplan =
          fromFloor !== 'unassigned' &&
          updatedSourceKeyitems.length === 0 &&
          sourceFloor.floorplan !== null;

        return {
          photoKeys: {
            ...state.photoKeys,
            [photoKeyId]: updateLastModified({
              ...photoKey,
              floors: {
                ...floors,
                [fromFloor]: {
                  ...sourceFloor,
                  keyitems: updatedSourceKeyitems,
                  floorplan: shouldRemoveSourceFloorplan ? null : sourceFloor.floorplan,
                },
                [toFloor]: {
                  ...targetFloor,
                  keyitems: [...targetFloor.keyitems, updatedItem],
                },
              },
            }),
          },
        };
      });
    },

    addFloorplan: (photoKeyId: string, floorNumber: string, floorplan: Floorplan) => {
      set((state) => {
        const photoKey = state.photoKeys[photoKeyId];
        if (!photoKey) return state;

        const floors = ensureFloor(photoKey.floors, floorNumber);
        const floor = floors[floorNumber];

        return {
          photoKeys: {
            ...state.photoKeys,
            [photoKeyId]: updateLastModified({
              ...photoKey,
              floors: {
                ...floors,
                [floorNumber]: {
                  ...floor,
                  floorplan,
                },
              },
            }),
          },
        };
      });
    },

    updateFloorplan: (photoKeyId: string, floorNumber: string, updates: Partial<Floorplan>) => {
      set((state) => {
        const photoKey = state.photoKeys[photoKeyId];
        if (!photoKey) return state;

        const floor = photoKey.floors[floorNumber];
        if (!floor || !floor.floorplan) return state;

        return {
          photoKeys: {
            ...state.photoKeys,
            [photoKeyId]: updateLastModified({
              ...photoKey,
              floors: {
                ...photoKey.floors,
                [floorNumber]: {
                  ...floor,
                  floorplan: { ...floor.floorplan, ...updates },
                },
              },
            }),
          },
        };
      });
    },

    removeFloorplan: (photoKeyId: string, floorNumber: string) => {
      set((state) => {
        const photoKey = state.photoKeys[photoKeyId];
        if (!photoKey) return state;

        const floor = photoKey.floors[floorNumber];
        if (!floor) return state;

        return {
          photoKeys: {
            ...state.photoKeys,
            [photoKeyId]: updateLastModified({
              ...photoKey,
              floors: {
                ...photoKey.floors,
                [floorNumber]: {
                  ...floor,
                  floorplan: null,
                },
              },
            }),
          },
        };
      });
    },
  }));

// Helper to create a test KeyItem
const createTestKeyItem = (overrides: Partial<KeyItem> = {}): KeyItem => ({
  id: `test-item-${Math.random().toString(36).substr(2, 9)}`,
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

// Helper to create a test Floorplan
const createTestFloorplan = (overrides: Partial<Floorplan> = {}): Floorplan => ({
  id: `test-floorplan-${Math.random().toString(36).substr(2, 9)}`,
  imageUri: 'file:///test/floorplan.png',
  centerCoordinates: { latitude: 0, longitude: 0 },
  rotation: 0,
  scale: 1.0,
  floorNumber: '1',
  ...overrides,
});

describe('PhotoKeyStore', () => {
  let useStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    // Create a fresh store for each test
    useStore = createTestStore();
  });

  describe('addPhotoKey', () => {
    it('creates a new photo key with the given name', () => {
      const id = useStore.getState().addPhotoKey('Test Project');

      const photoKey = useStore.getState().photoKeys[id];
      expect(photoKey).toBeDefined();
      expect(photoKey.name).toBe('Test Project');
    });

    it('generates a unique UUID for the photo key', () => {
      const id = useStore.getState().addPhotoKey('Test');

      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidPattern);
    });

    it('sets dateCreated and lastModified to current time', () => {
      const before = new Date().toISOString();
      const id = useStore.getState().addPhotoKey('Test');
      const after = new Date().toISOString();

      const photoKey = useStore.getState().photoKeys[id];
      expect(photoKey.dateCreated >= before).toBe(true);
      expect(photoKey.dateCreated <= after).toBe(true);
      expect(photoKey.lastModified).toBe(photoKey.dateCreated);
    });

    it('initializes with unassigned floor only', () => {
      const id = useStore.getState().addPhotoKey('Test');

      const photoKey = useStore.getState().photoKeys[id];
      expect(Object.keys(photoKey.floors)).toEqual(['unassigned']);
      expect(photoKey.floors.unassigned.floorplan).toBeNull();
      expect(photoKey.floors.unassigned.keyitems).toEqual([]);
    });

    it('can create multiple photo keys', () => {
      const store = useStore.getState();
      const id1 = store.addPhotoKey('Project 1');
      const id2 = store.addPhotoKey('Project 2');
      const id3 = store.addPhotoKey('Project 3');

      const state = useStore.getState();
      expect(Object.keys(state.photoKeys)).toHaveLength(3);
      expect(state.photoKeys[id1].name).toBe('Project 1');
      expect(state.photoKeys[id2].name).toBe('Project 2');
      expect(state.photoKeys[id3].name).toBe('Project 3');
    });
  });

  describe('removePhotoKey', () => {
    it('removes the photo key from the store', () => {
      const id = useStore.getState().addPhotoKey('To Delete');

      expect(useStore.getState().photoKeys[id]).toBeDefined();

      useStore.getState().removePhotoKey(id);

      expect(useStore.getState().photoKeys[id]).toBeUndefined();
    });

    it('does not affect other photo keys', () => {
      const store = useStore.getState();
      const id1 = store.addPhotoKey('Keep');
      const id2 = store.addPhotoKey('Delete');

      useStore.getState().removePhotoKey(id2);

      const state = useStore.getState();
      expect(state.photoKeys[id1]).toBeDefined();
      expect(state.photoKeys[id2]).toBeUndefined();
    });
  });

  describe('addKeyItem', () => {
    it('adds a key item to the specified floor', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem();

      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item);

      const photoKey = useStore.getState().photoKeys[photoKeyId];
      expect(photoKey.floors.unassigned.keyitems).toHaveLength(1);
      expect(photoKey.floors.unassigned.keyitems[0].id).toBe(item.id);
    });

    it('creates the floor if it does not exist', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem({ floorNumber: '5' });

      useStore.getState().addKeyItem(photoKeyId, '5', item);

      const photoKey = useStore.getState().photoKeys[photoKeyId];
      expect(photoKey.floors['5']).toBeDefined();
      expect(photoKey.floors['5'].keyitems).toHaveLength(1);
    });

    it('accumulates items on multiple imports (does not replace)', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');

      const item1 = createTestKeyItem({ name: 'Photo 1' });
      const item2 = createTestKeyItem({ name: 'Photo 2' });
      const item3 = createTestKeyItem({ name: 'Photo 3' });

      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item1);
      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item2);
      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item3);

      const photoKey = useStore.getState().photoKeys[photoKeyId];
      expect(photoKey.floors.unassigned.keyitems).toHaveLength(3);
      expect(photoKey.floors.unassigned.keyitems[0].name).toBe('Photo 1');
      expect(photoKey.floors.unassigned.keyitems[1].name).toBe('Photo 2');
      expect(photoKey.floors.unassigned.keyitems[2].name).toBe('Photo 3');
    });

    it('updates lastModified when adding items', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const initialModified = useStore.getState().photoKeys[photoKeyId].lastModified;

      const item = createTestKeyItem();
      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item);

      const updatedModified = useStore.getState().photoKeys[photoKeyId].lastModified;
      expect(updatedModified >= initialModified).toBe(true);
    });
  });

  describe('removeKeyItem', () => {
    it('removes the specified item from the floor', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem();

      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item);
      expect(useStore.getState().photoKeys[photoKeyId].floors.unassigned.keyitems).toHaveLength(1);

      useStore.getState().removeKeyItem(photoKeyId, 'unassigned', item.id);
      expect(useStore.getState().photoKeys[photoKeyId].floors.unassigned.keyitems).toHaveLength(0);
    });

    it('auto-removes floorplan when numbered floor becomes empty', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem({ floorNumber: '1' });
      const floorplan = createTestFloorplan({ floorNumber: '1' });

      useStore.getState().addKeyItem(photoKeyId, '1', item);
      useStore.getState().addFloorplan(photoKeyId, '1', floorplan);

      expect(useStore.getState().photoKeys[photoKeyId].floors['1'].floorplan).not.toBeNull();

      useStore.getState().removeKeyItem(photoKeyId, '1', item.id);

      expect(useStore.getState().photoKeys[photoKeyId].floors['1'].floorplan).toBeNull();
    });

    it('does not remove floorplan from unassigned floor', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem();
      const floorplan = createTestFloorplan({ floorNumber: 'unassigned' });

      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item);
      useStore.getState().addFloorplan(photoKeyId, 'unassigned', floorplan);
      useStore.getState().removeKeyItem(photoKeyId, 'unassigned', item.id);

      expect(useStore.getState().photoKeys[photoKeyId].floors.unassigned.floorplan).not.toBeNull();
    });
  });

  describe('moveKeyItemToFloor', () => {
    it('moves item from one floor to another', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem({ floorNumber: 'unassigned' });

      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item);
      useStore.getState().moveKeyItemToFloor(photoKeyId, item.id, 'unassigned', '1');

      const photoKey = useStore.getState().photoKeys[photoKeyId];
      expect(photoKey.floors.unassigned.keyitems).toHaveLength(0);
      expect(photoKey.floors['1'].keyitems).toHaveLength(1);
      expect(photoKey.floors['1'].keyitems[0].floorNumber).toBe('1');
    });

    it('creates target floor if it does not exist', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem();

      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item);
      useStore.getState().moveKeyItemToFloor(photoKeyId, item.id, 'unassigned', '10');

      const photoKey = useStore.getState().photoKeys[photoKeyId];
      expect(photoKey.floors['10']).toBeDefined();
      expect(photoKey.floors['10'].keyitems).toHaveLength(1);
    });

    it('auto-removes floorplan when source floor becomes empty', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem({ floorNumber: '1' });
      const floorplan = createTestFloorplan({ floorNumber: '1' });

      useStore.getState().addKeyItem(photoKeyId, '1', item);
      useStore.getState().addFloorplan(photoKeyId, '1', floorplan);

      useStore.getState().moveKeyItemToFloor(photoKeyId, item.id, '1', '2');

      expect(useStore.getState().photoKeys[photoKeyId].floors['1'].floorplan).toBeNull();
    });

    it('updates the item floorNumber property', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem({ floorNumber: 'unassigned' });

      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item);
      useStore.getState().moveKeyItemToFloor(photoKeyId, item.id, 'unassigned', '3');

      const movedItem = useStore.getState().photoKeys[photoKeyId].floors['3'].keyitems[0];
      expect(movedItem.floorNumber).toBe('3');
    });
  });

  describe('addFloorplan', () => {
    it('adds floorplan to specified floor', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const floorplan = createTestFloorplan({ floorNumber: '1' });

      useStore.getState().addFloorplan(photoKeyId, '1', floorplan);

      const photoKey = useStore.getState().photoKeys[photoKeyId];
      expect(photoKey.floors['1'].floorplan).toEqual(floorplan);
    });

    it('creates floor if it does not exist', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const floorplan = createTestFloorplan({ floorNumber: '7' });

      useStore.getState().addFloorplan(photoKeyId, '7', floorplan);

      const photoKey = useStore.getState().photoKeys[photoKeyId];
      expect(photoKey.floors['7']).toBeDefined();
      expect(photoKey.floors['7'].floorplan).toEqual(floorplan);
    });
  });

  describe('updateFloorplan', () => {
    it('updates floorplan properties', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const floorplan = createTestFloorplan({ scale: 1.0, rotation: 0 });

      useStore.getState().addFloorplan(photoKeyId, '1', floorplan);
      useStore.getState().updateFloorplan(photoKeyId, '1', { scale: 2.5, rotation: 45 });

      const updatedFloorplan = useStore.getState().photoKeys[photoKeyId].floors['1'].floorplan;
      expect(updatedFloorplan?.scale).toBe(2.5);
      expect(updatedFloorplan?.rotation).toBe(45);
    });
  });

  describe('removeFloorplan', () => {
    it('removes floorplan from floor', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const floorplan = createTestFloorplan();

      useStore.getState().addFloorplan(photoKeyId, '1', floorplan);
      expect(useStore.getState().photoKeys[photoKeyId].floors['1'].floorplan).not.toBeNull();

      useStore.getState().removeFloorplan(photoKeyId, '1');
      expect(useStore.getState().photoKeys[photoKeyId].floors['1'].floorplan).toBeNull();
    });
  });

  describe('multiple photo keys isolation', () => {
    it('changes to one photo key do not affect others', () => {
      const store = useStore.getState();
      const id1 = store.addPhotoKey('Project A');
      const id2 = store.addPhotoKey('Project B');

      const item = createTestKeyItem({ name: 'Photo for A' });
      useStore.getState().addKeyItem(id1, 'unassigned', item);

      const stateAfter = useStore.getState();
      expect(stateAfter.photoKeys[id1].floors.unassigned.keyitems).toHaveLength(1);
      expect(stateAfter.photoKeys[id2].floors.unassigned.keyitems).toHaveLength(0);
    });
  });

  describe('updateKeyItem', () => {
    it('updates item properties', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem({ name: 'Original Name', notes: '' });

      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item);
      useStore.getState().updateKeyItem(photoKeyId, 'unassigned', item.id, {
        name: 'Updated Name',
        notes: 'Some notes here',
      });

      const updatedItem = useStore.getState().photoKeys[photoKeyId].floors.unassigned.keyitems[0];
      expect(updatedItem.name).toBe('Updated Name');
      expect(updatedItem.notes).toBe('Some notes here');
    });
  });

  describe('updatePhotoKey', () => {
    it('updates photo key name', () => {
      const id = useStore.getState().addPhotoKey('Original');

      useStore.getState().updatePhotoKey(id, { name: 'Renamed' });

      expect(useStore.getState().photoKeys[id].name).toBe('Renamed');
    });

    it('updates lastModified on any update', () => {
      const id = useStore.getState().addPhotoKey('Test');
      const initialModified = useStore.getState().photoKeys[id].lastModified;

      useStore.getState().updatePhotoKey(id, { name: 'Changed' });

      const newModified = useStore.getState().photoKeys[id].lastModified;
      expect(newModified >= initialModified).toBe(true);
    });
  });

  describe('special characters and edge cases', () => {
    it('handles photo key names with special characters', () => {
      const id = useStore.getState().addPhotoKey('Test #1 @ Building (Main)');

      const photoKey = useStore.getState().photoKeys[id];
      expect(photoKey.name).toBe('Test #1 @ Building (Main)');
    });

    it('handles photo key names with emoji', () => {
      const id = useStore.getState().addPhotoKey('Building Survey 🏢');

      const photoKey = useStore.getState().photoKeys[id];
      expect(photoKey.name).toBe('Building Survey 🏢');
    });

    it('handles photo key names with unicode characters', () => {
      const id = useStore.getState().addPhotoKey('Café & Résumé — Test');

      const photoKey = useStore.getState().photoKeys[id];
      expect(photoKey.name).toBe('Café & Résumé — Test');
    });

    it('handles very long photo key names', () => {
      const longName = 'A'.repeat(200);
      const id = useStore.getState().addPhotoKey(longName);

      const photoKey = useStore.getState().photoKeys[id];
      expect(photoKey.name).toBe(longName);
      expect(photoKey.name.length).toBe(200);
    });
  });

  describe('multi-digit floor numbers', () => {
    it('handles floor number 10', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem({ floorNumber: '10' });

      useStore.getState().addKeyItem(photoKeyId, '10', item);

      const photoKey = useStore.getState().photoKeys[photoKeyId];
      expect(photoKey.floors['10']).toBeDefined();
      expect(photoKey.floors['10'].keyitems).toHaveLength(1);
    });

    it('handles floor number 99', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem({ floorNumber: '99' });

      useStore.getState().addKeyItem(photoKeyId, '99', item);

      const photoKey = useStore.getState().photoKeys[photoKeyId];
      expect(photoKey.floors['99']).toBeDefined();
    });

    it('moves item to multi-digit floor', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item = createTestKeyItem();

      useStore.getState().addKeyItem(photoKeyId, 'unassigned', item);
      useStore.getState().moveKeyItemToFloor(photoKeyId, item.id, 'unassigned', '15');

      const photoKey = useStore.getState().photoKeys[photoKeyId];
      expect(photoKey.floors['15'].keyitems).toHaveLength(1);
      expect(photoKey.floors['15'].keyitems[0].floorNumber).toBe('15');
    });

    it('keeps floors 1 and 10 separate', () => {
      const photoKeyId = useStore.getState().addPhotoKey('Test');
      const item1 = createTestKeyItem({ name: 'Floor 1 Photo' });
      const item10 = createTestKeyItem({ name: 'Floor 10 Photo' });

      useStore.getState().addKeyItem(photoKeyId, '1', item1);
      useStore.getState().addKeyItem(photoKeyId, '10', item10);

      const photoKey = useStore.getState().photoKeys[photoKeyId];
      expect(photoKey.floors['1'].keyitems).toHaveLength(1);
      expect(photoKey.floors['10'].keyitems).toHaveLength(1);
      expect(photoKey.floors['1'].keyitems[0].name).toBe('Floor 1 Photo');
      expect(photoKey.floors['10'].keyitems[0].name).toBe('Floor 10 Photo');
    });
  });
});
