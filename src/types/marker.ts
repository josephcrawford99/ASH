export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface MarkerData {
  latitude: number;
  longitude: number;
  direction: number; // Compass direction in degrees (0-360)
  number: number;    // Sequential number for display
}

export interface DirectionalMarkerProps {
  coordinate: Coordinate;
  number: number;
  direction: number;
}