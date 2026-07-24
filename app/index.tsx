import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PhotoList from '../src/components/PhotoList';
import { photoStore } from '../src/store/photoStore';
import { processImagePickerAssets } from '../src/utils/metadataPull';

export default function HomeScreen() {
  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      exif: true,
      quality: 1,
    });

    if (!result.canceled) {
      const items = processImagePickerAssets(result.assets);
      photoStore.setPhotos(items);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>ASH - Architectural Surveying Hub</Text>

      <Button title="Select Images" onPress={pickImages} />

      <PhotoList />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
