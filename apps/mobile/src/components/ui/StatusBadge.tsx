import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '@/lib/theme';

export type StatusType =
  | 'available'
  | 'offered'
  | 'booked'
  | 'running'
  | 'completed'
  | 'cancelled';

interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  animated?: boolean;
  useLottie?: boolean;
}

const statusConfig: Record<
  StatusType,
  { label: string; color: string; dotColor: string }
> = {
  available: {
    label: 'Available',
    color: theme.colors.success,
    dotColor: theme.colors.success,
  },
  offered: {
    label: 'Offered',
    color: theme.colors.warning,
    dotColor: theme.colors.warning,
  },
  booked: {
    label: 'Booked',
    color: theme.colors.primary,
    dotColor: theme.colors.primary,
  },
  running: {
    label: 'Running',
    color: theme.colors.info,
    dotColor: theme.colors.info,
  },
  completed: {
    label: 'Completed',
    color: theme.colors.mutedForeground,
    dotColor: theme.colors.mutedForeground,
  },
  cancelled: {
    label: 'Cancelled',
    color: theme.colors.destructive,
    dotColor: theme.colors.destructive,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showDot = true,
  animated = false,
  useLottie = false,
}) => {
  const config = statusConfig[status];
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (status === 'available' && !animated && showDot) {
      // Pulse animation for available status
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [status, animated, showDot, pulseAnim]);

  return (
    <View style={styles.container}>
      {showDot && !animated && !useLottie && (
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: config.dotColor },
            status === 'available' && { transform: [{ scale: pulseAnim }] },
          ]}
        />
      )}
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.muted,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
});
