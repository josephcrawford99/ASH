import { useState } from 'react';
import { StyleSheet, View, Modal, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/spacing';

interface PdfViewerProps {
  visible: boolean;
  uri: string;
  title: string;
  onClose: () => void;
}

export function PdfViewer({ visible, uri, title, onClose }: PdfViewerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText type="subtitle" style={styles.title} numberOfLines={1}>
              {title}
            </ThemedText>
            <ThemedText style={styles.pageInfo}>
              Page {pageInfo.current} of {pageInfo.total}
            </ThemedText>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* PDF Content */}
        <View style={styles.pdfContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.text} />
              <ThemedText style={styles.loadingText}>Loading PDF...</ThemedText>
            </View>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : (
            <Pdf
              source={{ uri }}
              style={styles.pdf}
              onLoadComplete={(numberOfPages) => {
                setIsLoading(false);
                setPageInfo({ current: 1, total: numberOfPages });
              }}
              onPageChanged={(page, numberOfPages) => {
                setPageInfo({ current: page, total: numberOfPages });
              }}
              onError={(err) => {
                setIsLoading(false);
                setError(err.message || 'Failed to load PDF');
              }}
              enablePaging={true}
              horizontal={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44, // Match close button width
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 12,
    opacity: 0.6,
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width,
    height,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});
