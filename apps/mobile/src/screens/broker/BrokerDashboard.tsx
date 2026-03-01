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
import { useAuth } from '@/auth';
import { KPICard } from '@/components';
import { useBookings, useOffers, useRequests } from '@/hooks';
import { formatCurrencyFromCents, toFiniteNumber } from '@/lib/format';
import { theme } from '@/lib/theme';
import loadingAnimation from '@/assets/lottie/icons/loading.json';

export const BrokerDashboard = () => {
  const { session, logout } = useAuth();

  const {
    data: requests,
    isLoading: requestsLoading,
    isFetching: requestsFetching,
    refetch: refetchRequests,
  } = useRequests(undefined, { refetchInterval: 15000 });

  const {
    data: offers,
    isFetching: offersFetching,
    refetch: refetchOffers,
  } = useOffers(undefined, { refetchInterval: 10000 });

  const {
    data: bookings,
    isFetching: bookingsFetching,
    refetch: refetchBookings,
  } = useBookings({ refetchInterval: 10000 });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchRequests(),
      refetchOffers(),
      refetchBookings(),
    ]);
    setRefreshing(false);
  }, [refetchRequests, refetchOffers, refetchBookings]);

  const myRequests = React.useMemo(
    () =>
      (requests ?? []).filter(
        (request) => request.createdBy === session?.user.id
      ),
    [requests, session?.user.id]
  );

  const pendingOffers = React.useMemo(
    () => (offers ?? []).filter((offer) => offer.status === 'pending').length,
    [offers]
  );

  const activeBookings = React.useMemo(
    () =>
      (bookings ?? []).filter((booking) =>
        ['pending_deposit', 'confirmed', 'running', 'awaiting_review'].includes(
          booking.status
        )
      ).length,
    [bookings]
  );

  const bookedValue = React.useMemo(
    () =>
      (bookings ?? [])
        .filter((booking) => booking.status !== 'cancelled')
        .reduce((sum, booking) => sum + toFiniteNumber(booking.amountCents), 0),
    [bookings]
  );

  if (requestsLoading && !requests) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading broker dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing || requestsFetching || offersFetching || bookingsFetching
            }
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Broker Console</Text>
            <Text style={styles.name}>{session?.user.displayName}</Text>
            <Text style={styles.meta}>Realtime refresh active (10-15s polling)</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={() => void logout()}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiItem}>
              <KPICard
                iconSource={loadingAnimation}
                label="My Requests"
                value={myRequests.length}
              />
            </View>
            <View style={styles.kpiItem}>
              <KPICard
                iconSource={loadingAnimation}
                label="Pending Offers"
                value={pendingOffers}
              />
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiItem}>
              <KPICard
                iconSource={loadingAnimation}
                label="Active Bookings"
                value={activeBookings}
              />
            </View>
            <View style={styles.kpiItem}>
              <KPICard
                iconSource={loadingAnimation}
                label="Booked Value"
                value={formatCurrencyFromCents(bookedValue)}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          {myRequests.length === 0 ? (
            <Text style={styles.emptyText}>No requests yet. Create one in the Requests tab.</Text>
          ) : (
            myRequests.slice(-3).reverse().map((request) => (
              <View key={request.id} style={styles.card}>
                <Text style={styles.cardTitle}>{request.title}</Text>
                <Text style={styles.cardMeta}>Region: {request.region}</Text>
                <Text style={styles.cardMeta}>Status: {request.status}</Text>
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
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  name: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.bold,
  },
  meta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  logoutText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  kpiItem: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
  cardMeta: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  emptyText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
