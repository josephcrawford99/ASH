import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import PhotoListItem from './PhotoListItem';
import { PhotoData } from '../types/photo';
import { photoStore } from '../store/photoStore';

export default function PhotoList() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);

  useEffect(() => {
    const unsubscribe = photoStore.subscribe(setPhotos);
    setPhotos(photoStore.getPhotos());
    return unsubscribe;
  }, []);

  const updateImageNote = (uri: string, note: string) => {
    photoStore.updateImageNote(uri, note);
  };

  const updateImageFloor = (uri: string, floor?: number) => {
    photoStore.updateImageFloor(uri, floor);
  };

  return (
    <FlatList
      style={styles.container}
      data={photos}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item }) => (
        <PhotoListItem
          asset={item.asset}
          index={item.index}
          note={item.note}
          floor={item.floor}
          onNoteUpdate={(note) => updateImageNote(item.asset.uri, note)}
          onFloorUpdate={(floor?: number) => updateImageFloor(item.asset.uri, floor)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    marginTop: 20,
  },
});
