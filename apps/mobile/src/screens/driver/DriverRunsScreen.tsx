import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useBookings,
  useDriverLocation,
  useUpdateBookingStatus,
  useUpdateDriverLocation,
} from '@/hooks';
import { theme } from '@/lib/theme';

export const DriverRunsScreen = () => {
  const {
    data: bookings,
    isLoading,
    isFetching,
    refetch,
  } = useBookings({ refetchInterval: 8000 });
  const { data: driverLocation } = useDriverLocation();

  const updateBookingStatus = useUpdateBookingStatus();
  const updateDriverLocation = useUpdateDriverLocation();

  const [refreshing, setRefreshing] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [activeBookingId, setActiveBookingId] = React.useState<string | null>(null);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleStartRun = async (bookingId: string) => {
    setActionError(null);
    setActiveBookingId(bookingId);

    if (driverLocation?.latitude == null || driverLocation?.longitude == null) {
      setActionError(
        'Location is unavailable. Update your position in the Location tab first.'
      );
      setActiveBookingId(null);
      return;
    }

    try {
      await updateDriverLocation.mutateAsync({
        bookingId,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        isOnline: true,
      });

      await updateBookingStatus.mutateAsync({
        id: bookingId,
        status: 'running',
      });
    } catch (startError) {
      setActionError(
        startError instanceof Error ? startError.message : 'Failed to start run.'
      );
    } finally {
      setActiveBookingId(null);
    }
  };

  if (isLoading && !bookings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading assigned runs...</Text>
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
          <Text style={styles.sectionTitle}>Assigned Runs</Text>
          <Text style={styles.helper}>
            Driver status progression: confirmed {'->'} running {'->'} awaiting_review.
          </Text>
          <Text style={styles.helper}>
            Start Run uses your latest location from the Location tab.
          </Text>

          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

          {(bookings ?? []).length === 0 ? (
            <Text style={styles.emptyText}>No assigned driver bookings.</Text>
          ) : (
            (bookings ?? [])
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              .map((booking) => {
                const busy =
                  (updateBookingStatus.isPending || updateDriverLocation.isPending) &&
                  activeBookingId === booking.id;

                return (
                  <View key={booking.id} style={styles.card}>
                    <Text style={styles.cardTitle}>Booking {booking.id.slice(0, 8)}</Text>
                    <Text style={styles.cardMeta}>Status: {booking.status}</Text>
                    <Text style={styles.cardMeta}>Region: {booking.slot?.region ?? 'Unknown'}</Text>
                    <Text style={styles.cardMeta}>Slot ID: {booking.slot?.id ?? 'N/A'}</Text>

                    {booking.status === 'confirmed' ? (
                      <TouchableOpacity
                        style={styles.primaryAction}
                        onPress={() => void handleStartRun(booking.id)}
                        disabled={busy}
                      >
                        <Text style={styles.primaryActionText}>
                          {busy ? 'Updating...' : 'Start Run'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {booking.status === 'running' ? (
                      <Text style={styles.hintText}>
                        Run in progress. Move to the Proof tab to submit evidence and
                        transition to `awaiting_review`.
                      </Text>
                    ) : null}
                  </View>
                );
              })
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
    color: theme.colors.foreground,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  helper: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    gap: 4,
  },
  cardTitle: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
  cardMeta: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
  },
  primaryAction: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  primaryActionText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  hintText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xs,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
