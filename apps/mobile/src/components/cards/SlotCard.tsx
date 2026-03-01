import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBadge, StatusType } from '../ui/StatusBadge';
import { RegionChip } from '../ui/RegionChip';
import { formatWholeNumber } from '@/lib/format';
import { theme } from '@/lib/theme';

export interface SlotData {
  id: string;
  truckName: string;
  screenSize: string;
  region: string;
  date: string;
  timeWindow: string;
  price: number;
  status: StatusType;
  isVerified?: boolean;
}

interface SlotCardProps {
  slot: SlotData;
  onPress?: () => void;
}

export const SlotCard: React.FC<SlotCardProps> = ({ slot, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.truckName}>{slot.truckName}</Text>
            {slot.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>
          <RegionChip region={slot.region} />
        </View>

        <View style={styles.headerRight}>
          <StatusBadge
            status={slot.status}
            animated={slot.status === 'available' || slot.status === 'running'}
          />
          <View style={styles.priceRow}>
            <Text style={styles.currency}>$</Text>
            <Text style={styles.price}>{formatWholeNumber(slot.price)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>📺</Text>
          <Text style={styles.detailText}>{slot.screenSize}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>{slot.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>🕐</Text>
          <Text style={styles.detailText}>{slot.timeWindow}</Text>
        </View>
      </View>

      {onPress && (
        <View style={styles.footer}>
          <Text style={styles.viewDetails}>View Details →</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  truckName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: 10,
    color: theme.colors.primaryForeground,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  price: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  details: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  footer: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'flex-end',
  },
  viewDetails: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
});
