import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LottieIcon } from '../LottieIcon';
import { theme } from '@/lib/theme';

export interface KPICardProps {
  /** Lottie animation source for icon */
  iconSource?: any;
  /** Label text */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Optional trend indicator */
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** Use Lottie animation (default: true) */
  useLottie?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  iconSource,
  label,
  value,
  trend,
  useLottie = true,
}) => {
  return (
    <View style={styles.container}>
      {/* Icon Container */}
      {iconSource && useLottie && (
        <View style={styles.iconContainer}>
          <LottieIcon
            source={iconSource}
            size={20}
            loop={false}
            autoPlay={true}
          />
        </View>
      )}

      {/* Value */}
      <Text style={styles.value}>{value}</Text>

      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Trend */}
      {trend && (
        <Text
          style={[
            styles.trend,
            { color: trend.isPositive ? theme.colors.success : theme.colors.destructive },
          ]}
        >
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last week
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 120,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  value: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: 4,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  trend: {
    fontSize: theme.fontSize.xs,
    marginTop: 4,
  },
});
