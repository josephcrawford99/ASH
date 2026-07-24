import { PhotoData } from '../types/photo';

class PhotoStore {
  private photos: PhotoData[] = [];
  private listeners: Array<(photos: PhotoData[]) => void> = [];

  getPhotos(): PhotoData[] {
    return this.photos;
  }

  setPhotos(photos: PhotoData[]): void {
    this.photos = photos;
    this.notifyListeners();
  }

  updateImageNote(uri: string, note: string): void {
    this.photos = this.photos.map(photo => 
      photo.asset.uri === uri ? { ...photo, note } : photo
    );
    this.notifyListeners();
  }

  updateImageFloor(uri: string, floor?: number): void {
    this.photos = this.photos.map(photo => 
      photo.asset.uri === uri ? { ...photo, floor } : photo
    );
    this.notifyListeners();
  }

  subscribe(listener: (photos: PhotoData[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.photos));
  }
}

export const photoStore = new PhotoStore();