/**
 * ASH Type Definitions
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RelativeCoordinates {
  x: number;
  y: number;
}

export interface KeyItem {
  id: string;
  photoUri: string;
  originalAssetId: string;
  coordinates: Coordinates | null;
  coordinatesRelativeToFloor: RelativeCoordinates | null;
  direction: number | null;  // Compass heading 0-360 degrees
  floorNumber: string;       // "1", "2", "unassigned", etc.
  name: string;
  notes: string;
}

export interface Floorplan {
  id: string;
  imageUri: string;
  centerCoordinates: Coordinates;
  rotation: number;  // Degrees
  scale: number;     // Multiplier for floorplan size (1.0 = covers marker bounds)
  floorNumber: string;
}

export interface Floor {
  floorplan: Floorplan | null;
  keyitems: KeyItem[];
}

export interface PhotoKey {
  id: string;
  name: string;
  dateCreated: string;    // ISO string
  lastModified: string;   // ISO string
  floors: Record<string, Floor>;
}

export type FloorNumber = string;  // "1", "2", "unassigned", etc.
