import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhotoKey, KeyItem, Floorplan, Floor } from '@/types';

const STORE_VERSION = 1;

export interface PhotoKeyStore {
  photoKeys: Record<string, PhotoKey>;

  // Photo Key actions
  addPhotoKey: (name: string) => string;
  removePhotoKey: (id: string) => void;
  updatePhotoKey: (id: string, updates: Partial<PhotoKey>) => void;

  // KeyItem actions
  addKeyItem: (photoKeyId: string, floorNumber: string, item: KeyItem) => void;
  removeKeyItem: (photoKeyId: string, floorNumber: string, itemId: string) => void;
  updateKeyItem: (photoKeyId: string, floorNumber: string, itemId: string, updates: Partial<KeyItem>) => void;
  moveKeyItemToFloor: (photoKeyId: string, itemId: string, fromFloor: string, toFloor: string) => void;

  // Floorplan actions
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

function ensureFloor(floors: Record<string, Floor>, floorNumber: string): Record<string, Floor> {
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

export const usePhotoKeyStore = create<PhotoKeyStore>()(
  persist(
    (set, get) => ({
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

          // Auto-remove floorplan if floor becomes empty (except unassigned)
          const shouldRemoveFloorplan =
            floorNumber !== 'unassigned' &&
            updatedKeyitems.length === 0 &&
            floor.floorplan !== null;

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

      updateKeyItem: (photoKeyId: string, floorNumber: string, itemId: string, updates: Partial<KeyItem>) => {
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

      moveKeyItemToFloor: (photoKeyId: string, itemId: string, fromFloor: string, toFloor: string) => {
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

          // Auto-remove floorplan if source floor becomes empty (except unassigned)
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
    }),
    {
      name: 'ash-photo-key-storage',
      version: STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
