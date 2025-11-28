import { useCallback } from 'react';
import { StyleSheet, View, Pressable, Modal } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing, BorderRadius } from '@/constants/spacing';

export interface ActionMenuItem {
  label: string;
  onPress: () => void;
  icon?: string;
}

interface ActionMenuProps {
  visible: boolean;
  items: ActionMenuItem[];
  onClose: () => void;
}

export function ActionMenu({ visible, items, onClose }: ActionMenuProps) {
  const { colors } = useTheme();

  const handleItemPress = useCallback((item: ActionMenuItem) => {
    onClose();
    // Call immediately after closing
    item.onPress();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.menuContainer}>
          <View style={[styles.menu, { backgroundColor: colors.cardBackground }]}>
            {items.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() => handleItemPress(item)}
                style={({ pressed }) => [
                  styles.menuItem,
                  index < items.length - 1 && [
                    styles.menuItemBorder,
                    { borderBottomColor: colors.icon },
                  ],
                  pressed && { backgroundColor: colors.highlight },
                ]}
              >
                <ThemedText style={styles.menuItemText}>{item.label}</ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelButton,
              { backgroundColor: colors.cardBackground },
              pressed && { backgroundColor: colors.highlight },
            ]}
          >
            <ThemedText style={[styles.cancelText, { color: colors.text }]}>
              Cancel
            </ThemedText>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  menuContainer: {
    gap: Spacing.sm,
  },
  menu: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontSize: 18,
  },
  cancelButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
