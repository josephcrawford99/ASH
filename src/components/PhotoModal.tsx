import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { Image, useImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

interface PhotoModalProps {
  asset: ImagePicker.ImagePickerAsset;
  isVisible: boolean;
  initialNote: string;
  initialFloor?: number;
  onSave: (note: string, floor?: number) => void;
  onCancel: () => void;
}

export default function PhotoModal({ asset, isVisible, initialNote, initialFloor, onSave, onCancel }: PhotoModalProps) {
  const [tempNote, setTempNote] = useState(initialNote);
  const [tempFloor, setTempFloor] = useState<string>(initialFloor?.toString() || '');
  const image = useImage(asset.uri);

  const handleSaveNote = () => {
    const floorValue = tempFloor.trim() === '' ? undefined : parseInt(tempFloor, 10);
    onSave(tempNote, floorValue);
  };

  const handleCancelNote = () => {
    setTempNote(initialNote);
    setTempFloor(initialFloor?.toString() || '');
    onCancel();
  };

  React.useEffect(() => {
    setTempNote(initialNote);
    setTempFloor(initialFloor?.toString() || '');
  }, [initialNote, initialFloor]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancelNote}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Note</Text>
          {image ? (
            <Image
              source={image}
              style={styles.modalImage}
            />
          ) : (
            <View style={[styles.modalImage, styles.loadingContainer]}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
          <TextInput
            style={styles.floorInput}
            value={tempFloor}
            onChangeText={setTempFloor}
            placeholder="Enter floor number (optional)..."
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.noteInput}
            multiline
            value={tempNote}
            onChangeText={setTempNote}
            placeholder="Enter note for this image..."
            placeholderTextColor="#999"
            autoFocus
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelNote}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveNote}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  floorInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    height: 40,
    marginBottom: 10,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});