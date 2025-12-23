import { Fonts, FontSizes } from '@/constants/typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, Text, TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'subtitle' | 'mono' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...props
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        styles.default,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'mono' && styles.mono,
        type === 'link' && styles.link,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts.primary.regular,
    fontSize: FontSizes.base,
    lineHeight: 24,
  },
  title: {
    fontFamily: Fonts.primary.bold,
    fontSize: FontSizes['2xl'],
    lineHeight: 32,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: Fonts.primary.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: 18,
    opacity: 0.6,
  },
  mono: {
    fontFamily: Fonts.secondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  link: {
    fontFamily: Fonts.primary.medium,
    fontSize: FontSizes.base,
    lineHeight: 24,
    textDecorationLine: 'underline',
  },
});
