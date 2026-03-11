import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBookings, useUpdateBookingStatus } from '@/hooks';
import { BookingStatus } from '@/types/api';
import { formatCurrencyFromCents } from '@/lib/format';
import { theme } from '@/lib/theme';

const activeStatuses = new Set<BookingStatus>([
  'pending_deposit',
  'confirmed',
  'running',
  'awaiting_review',
]);

export const BrokerBookingsScreen = () => {
  const {
    data: bookings,
    isLoading,
    isFetching,
    refetch,
  } = useBookings({ refetchInterval: 10000 });

  const updateStatus = useUpdateBookingStatus();

  const [refreshing, setRefreshing] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [activeBookingId, setActiveBookingId] = React.useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = React.useState(
    'Cancelled by broker'
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleTransition = async (bookingId: string, status: BookingStatus) => {
    setActionError(null);
    setActiveBookingId(bookingId);

    try {
      await updateStatus.mutateAsync({
        id: bookingId,
        status,
        cancellationReason:
          status === 'cancelled' ? cancellationReason.trim() || undefined : undefined,
      });
    } catch (transitionError) {
      setActionError(
        transitionError instanceof Error
          ? transitionError.message
          : 'Failed to update booking status.'
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
          <Text style={styles.loadingText}>Loading broker bookings...</Text>
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
          <Text style={styles.sectionTitle}>Broker Booking Actions</Text>
          <Text style={styles.helper}>
            Uses `PATCH /bookings/:id/status` for role-specific transitions.
          </Text>

          <Text style={styles.fieldLabel}>Cancellation Reason</Text>
          <TextInput
            style={styles.input}
            value={cancellationReason}
            onChangeText={setCancellationReason}
          />

          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bookings</Text>

          {(bookings ?? []).length === 0 ? (
            <Text style={styles.emptyText}>No broker-visible bookings.</Text>
          ) : (
            (bookings ?? [])
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              .map((booking) => {
                const isBusy =
                  updateStatus.isPending && activeBookingId === booking.id;

                return (
                  <View key={booking.id} style={styles.card}>
                    <Text style={styles.cardTitle}>
                      {formatCurrencyFromCents(booking.amountCents)}
                    </Text>
                    <Text style={styles.cardMeta}>Status: {booking.status}</Text>
                    <Text style={styles.cardMeta}>Booking ID: {booking.id}</Text>
                    <Text style={styles.cardMeta}>
                      Slot: {booking.slot?.id ?? 'N/A'} ({booking.slot?.region ?? 'Unknown'})
                    </Text>

                    <View style={styles.actionsRow}>
                      {booking.status === 'pending_deposit' ? (
                        <TouchableOpacity
                          style={styles.primaryAction}
                          onPress={() => void handleTransition(booking.id, 'confirmed')}
                          disabled={isBusy}
                        >
                          <Text style={styles.primaryActionText}>
                            {isBusy ? 'Saving...' : 'Confirm Deposit'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      {booking.status === 'awaiting_review' ? (
                        <TouchableOpacity
                          style={styles.primaryAction}
                          onPress={() => void handleTransition(booking.id, 'completed')}
                          disabled={isBusy}
                        >
                          <Text style={styles.primaryActionText}>
                            {isBusy ? 'Saving...' : 'Approve Completion'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {activeStatuses.has(booking.status) ? (
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.secondaryAction}
                          onPress={() => void handleTransition(booking.id, 'cancelled')}
                          disabled={isBusy}
                        >
                          <Text style={styles.secondaryActionText}>
                            {isBusy ? 'Saving...' : 'Cancel'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryAction}
                          onPress={() => void handleTransition(booking.id, 'disputed')}
                          disabled={isBusy}
                        >
                          <Text style={styles.secondaryActionText}>
                            {isBusy ? 'Saving...' : 'Dispute'}
                          </Text>
                        </TouchableOpacity>
                      </View>
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
  fieldLabel: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.input,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.background,
    fontSize: theme.fontSize.sm,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
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
    fontWeight: theme.fontWeight.bold,
  },
  cardMeta: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  primaryAction: {
    flex: 1,
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
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  secondaryActionText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
