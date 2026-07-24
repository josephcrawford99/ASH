import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import PhotoModal from './PhotoModal';

interface PhotoListItemProps {
  asset: ImagePicker.ImagePickerAsset;
  index: number;
  note: string;
  floor?: number;
  onNoteUpdate: (note: string) => void;
  onFloorUpdate: (floor?: number) => void;
}

export default function PhotoListItem({ asset, index, note, floor, onNoteUpdate, onFloorUpdate }: PhotoListItemProps) {
  const [isModalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    setModalVisible(true);
  };

  const handleSaveNote = (newNote: string, newFloor?: number) => {
    onNoteUpdate(newNote);
    onFloorUpdate(newFloor);
    setModalVisible(false);
  };

  const handleCancelNote = () => {
    setModalVisible(false);
  };

  return (
    <TouchableOpacity style={styles.listItem} onPress={handlePress}>
      <Image
        source={{ uri: asset.uri }}
        style={styles.listImage}
      />
      <View style={styles.metadataContainer}>
        <Text style={styles.metadataText}>
          Index: {index}
        </Text>
        <Text style={styles.metadataText}>
          Name: {asset.fileName || asset.uri.split('/').pop() || 'Unknown'}
        </Text>
        <Text style={styles.metadataText}>
          Coordinates: {asset.exif?.GPSLatitude && asset.exif?.GPSLongitude
            ? `${asset.exif.GPSLatitude}, ${asset.exif.GPSLongitude}`
            : 'No GPS data'}
        </Text>
        <Text style={styles.metadataText}>
          Compass Direction: {asset.exif?.GPSImgDirection
            ? `${asset.exif.GPSImgDirection}°`
            : 'No direction data'}
        </Text>
        {floor !== undefined && (
          <Text style={styles.metadataText}>
            Floor: {floor}
          </Text>
        )}
        {note && (
          <Text style={styles.noteText}>
            Note: {note}
          </Text>
        )}
      </View>

      <PhotoModal
        asset={asset}
        isVisible={isModalVisible}
        initialNote={note}
        initialFloor={floor}
        onSave={handleSaveNote}
        onCancel={handleCancelNote}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  metadataContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  metadataText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  noteText: {
    fontSize: 14,
    marginTop: 5,
    fontStyle: 'italic',
    color: '#666',
  },
});
