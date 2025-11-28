/**
 * ASH Color Palette
 * Avoids pure black (#000000) and pure white (#FFFFFF) as per design system
 */

export const Colors = {
  light: {
    background: '#FAFAFA',  // Off-white
    text: '#1A1A1A',        // Dark charcoal
    error: '#C45C5C',       // Muted red
    border: '#E0E0E0',
    icon: '#666666',
    tint: '#1A1A1A',        // Primary action color
    cardBackground: '#FFFFFF',
    cardBorder: '#E8E8E8',
  },
  dark: {
    background: '#121212',  // Near-black
    text: '#F5F5F5',        // Off-white
    error: '#C45C5C',       // Muted red (same in both modes)
    border: '#333333',
    icon: '#999999',
    tint: '#F5F5F5',        // Primary action color
    cardBackground: '#1E1E1E',
    cardBorder: '#2A2A2A',
  },
};
