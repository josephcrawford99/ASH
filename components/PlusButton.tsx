import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useThemeColor';

interface PlusButtonProps {
  onPress: () => void;
  size?: number;
}

export function PlusButton({ onPress, size = 44 }: PlusButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.text,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <ThemedText
        style={[
          styles.icon,
          {
            color: colors.background,
            fontSize: size * 0.64,
            lineHeight: size * 0.73,
          },
        ]}
      >
        +
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontWeight: '300',
  },
});
