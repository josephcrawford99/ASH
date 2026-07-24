import { Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { PhotoData } from '../types/photo';
import { PDFTemplateService } from './pdfTemplateService';

export class ExportService {
  static async exportToImage(captureFunction: () => Promise<string>): Promise<void> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permission is needed to save images.');
        return;
      }

      const uri = await captureFunction();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Map image saved to photo library');
    } catch (error) {
      Alert.alert('Error', 'Failed to save image');
      console.error('Export to image error:', error);
    }
  }

  static async exportToPDF(
    captureFunction: () => Promise<string>,
    photos: PhotoData[]
  ): Promise<void> {
    try {
      const mapImageUri = await captureFunction();
      const photosWithGPS = photos.filter(p => p.hasGPS);
      
      // Convert images to base64 for PDF compatibility
      const getBase64Image = async (uri: string) => {
        const base64 = await FileSystem.readAsStringAsync(uri, { 
          encoding: FileSystem.EncodingType.Base64 
        });
        return `data:image/jpeg;base64,${base64}`;
      };

      const mapImageBase64 = await getBase64Image(mapImageUri);
      const photosBase64 = await Promise.all(
        photosWithGPS.map(photo => getBase64Image(photo.asset.uri))
      );
      
      // Prepare data for template
      const templateData = {
        mapImageBase64,
        photos: photosWithGPS.map((photo, index) => ({
          imageBase64: photosBase64[index],
          markerNumber: index + 1,
          floor: photo.floor,
          note: photo.note || 'No note'
        }))
      };

      // Generate HTML using template service
      const htmlContent = PDFTemplateService.generateHTML(templateData);

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to create PDF');
      console.error('Export to PDF error:', error);
    }
  }
}