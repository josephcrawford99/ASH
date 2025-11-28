import { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface NewPhotoKeyModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function NewPhotoKeyModal({ visible, onClose, onCreate }: NewPhotoKeyModalProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  const isCreateDisabled = !name.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <View style={styles.backdropInner} />
        </Pressable>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <ThemedText type="subtitle" style={styles.title}>
            New Photo Key
          </ThemedText>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter name..."
            placeholderTextColor={colors.icon}
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleCreate}
            returnKeyType="done"
            autoFocus
          />

          <Pressable
            onPress={handleCreate}
            disabled={isCreateDisabled}
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: colors.text },
              pressed && { opacity: 0.7 },
              isCreateDisabled && { opacity: 0.4 },
            ]}
          >
            <ThemedText style={[styles.createButtonText, { color: colors.background }]}>
              Create
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropInner: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: '85%',
    maxWidth: 320,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontFamily: Typography.fonts.regular,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  createButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  createButtonText: {
    fontFamily: Typography.fonts.semiBold,
    fontSize: 16,
  },
});
