import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/lib/theme';

export const LoadingScreen: React.FC<{ label?: string }> = ({
  label = 'Loading session...',
}) => {
  return (
    <View
      testID="loading-screen"
      accessibilityLabel="loading-screen"
      style={styles.container}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text
        testID="loading-label"
        accessibilityLabel="loading-label"
        style={styles.label}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  label: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.base,
  },
});
