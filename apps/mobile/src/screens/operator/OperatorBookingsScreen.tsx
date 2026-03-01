import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useBookings } from '@/hooks';
import { formatCurrencyFromCents } from '@/lib/format';
import { theme } from '@/lib/theme';

export const OperatorBookingsScreen = () => {
  const {
    data: bookings,
    isLoading,
    isFetching,
    refetch,
  } = useBookings();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sortedBookings = React.useMemo(() => {
    return (bookings ?? [])
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings]);

  if (isLoading && !bookings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing || isFetching} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bookings</Text>
          <Text style={styles.helper}>Uses `GET /bookings` for operator visibility.</Text>

          {sortedBookings.length === 0 ? (
            <Text style={styles.emptyHint}>No bookings yet.</Text>
          ) : (
            sortedBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingAmount}>
                    {formatCurrencyFromCents(booking.amountCents)}
                  </Text>
                  <Text style={styles.bookingStatus}>{booking.status}</Text>
                </View>

                <Text style={styles.bookingMeta}>Booking ID: {booking.id}</Text>
                <Text style={styles.bookingMeta}>
                  Operator Org: {booking.operatorOrg?.name ?? 'N/A'}
                </Text>
                <Text style={styles.bookingMeta}>
                  Slot: {booking.slot?.id ?? 'N/A'} ({booking.slot?.region ?? 'Unknown region'})
                </Text>
                <Text style={styles.bookingMeta}>
                  Deposit: {formatCurrencyFromCents(booking.depositCents)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.mutedForeground,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  helper: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
    marginBottom: theme.spacing.sm,
  },
  emptyHint: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  bookingCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    gap: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingAmount: {
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.base,
  },
  bookingStatus: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
    textTransform: 'capitalize',
  },
  bookingMeta: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
