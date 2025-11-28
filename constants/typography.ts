/**
 * ASH Typography System
 * Primary: Josefin Sans (Regular, Medium, SemiBold, Bold)
 * Secondary: Courier (system monospace)
 */

export const FONT_PRIMARY = 'JosefinSans';
export const FONT_SECONDARY = 'Courier';

export const Fonts = {
  primary: {
    regular: 'JosefinSans_400Regular',
    medium: 'JosefinSans_500Medium',
    semiBold: 'JosefinSans_600SemiBold',
    bold: 'JosefinSans_700Bold',
  },
  secondary: FONT_SECONDARY,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};
