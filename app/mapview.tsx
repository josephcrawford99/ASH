import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Map from '../src/components/Map';
import { ExportService } from '../src/utils/exportService';
import { photoStore } from '../src/store/photoStore';
import { PhotoData } from '../src/types/photo';

export default function MapScreen() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    const unsubscribe = photoStore.subscribe(setPhotos);
    setPhotos(photoStore.getPhotos());
    return unsubscribe;
  }, []);

  const handleExportToImage = async () => {
    if (!viewShotRef.current) return;

    const captureFunction = async () => {
      if (!viewShotRef.current?.capture) throw new Error('ViewShot not available');
      return await viewShotRef.current.capture();
    };

    await ExportService.exportToImage(captureFunction);
  };

  const handleExportToPDF = async () => {
    if (!viewShotRef.current) return;

    const captureFunction = async () => {
      if (!viewShotRef.current?.capture) throw new Error('ViewShot not available');
      return await viewShotRef.current.capture();
    };

    await ExportService.exportToPDF(captureFunction, photos);
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} style={styles.container}>
        <Map />
      </ViewShot>

      {/* Export buttons positioned over the map */}
      <View style={styles.exportButtonsContainer}>
        <TouchableOpacity
          onPress={handleExportToImage}
          style={[styles.exportButton, styles.imageButton]}
        >
          <Text style={styles.buttonText}>Export to Image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExportToPDF}
          style={[styles.exportButton, styles.pdfButton]}
        >
          <Text style={styles.buttonText}>Export to PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  exportButtonsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    zIndex: 1000,
  },
  exportButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  imageButton: {
    backgroundColor: '#28a745',
  },
  pdfButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
