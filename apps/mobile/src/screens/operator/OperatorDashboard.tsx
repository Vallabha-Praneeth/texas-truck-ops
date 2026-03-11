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
import { KPICard, SlotCard, SlotData } from '@/components';
import { useBookings, useOffers, useSlots, useMemberships } from '@/hooks';
import { formatCurrencyFromCents, toFiniteNumber } from '@/lib/format';
import {
  UI_TEST_FAKE_AUTH,
  UI_TEST_FORCE_DASHBOARD_ERROR,
  UI_TEST_FORCE_DASHBOARD_ERROR_ONCE,
} from '@/lib/launchArgs';
import { theme } from '@/lib/theme';
import loadingAnimation from '@/assets/lottie/icons/loading.json';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

export const OperatorDashboard = () => {
  const { session, logout } = useAuth();

  // In UI-test fake-auth mode the API server will return 401 for the fake
  // token, which triggers the unauthorized handler and immediately clears the
  // session.  Disable all data-fetching queries so no real HTTP calls are made.
  const isUITest = UI_TEST_FAKE_AUTH === 'YES';

  const {
    data: slots,
    isLoading: isSlotsLoading,
    isFetching: isSlotsFetching,
    error: slotsError,
    refetch: refetchSlots,
  } = useSlots(undefined, { enabled: !isUITest });

  const {
    data: offers,
    isFetching: isOffersFetching,
    error: offersError,
    refetch: refetchOffers,
  } = useOffers(undefined, { enabled: !isUITest });

  const {
    data: bookings,
    isFetching: isBookingsFetching,
    error: bookingsError,
    refetch: refetchBookings,
  } = useBookings({ enabled: !isUITest });

  const { data: membershipsResponse } = useMemberships({ enabled: !isUITest });

  const [refreshing, setRefreshing] = React.useState(false);

  // Tracks whether the user has tapped the Retry button so we can show
  // `operator-dashboard-retry-requested` while the refetch is in-flight.
  const [retryRequested, setRetryRequested] = React.useState(false);

  // For FORCE_DASHBOARD_ERROR_ONCE: once the user retries, the forced error
  // is consumed and the next render shows the recovered state.
  const [forcedErrorConsumed, setForcedErrorConsumed] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSlots(), refetchOffers(), refetchBookings()]);
    setRefreshing(false);
  }, [refetchSlots, refetchOffers, refetchBookings]);

  const handleRetry = React.useCallback(async () => {
    if (UI_TEST_FORCE_DASHBOARD_ERROR_ONCE === 'YES' && !forcedErrorConsumed) {
      setForcedErrorConsumed(true);
    }
    setRetryRequested(true);
    await Promise.all([refetchSlots(), refetchOffers(), refetchBookings()]);
    // When the error is permanently forced by a launch arg, keep the
    // retry-requested indicator visible so XCTest can detect it reliably.
    // XCTest's .tap() blocks for several seconds waiting for UI to stabilise;
    // clearing retryRequested immediately after the refetch causes the
    // indicator to disappear before waitForExistence even starts.  In normal
    // (non-forced-error) operation the indicator is always cleared so it
    // doesn't linger on screen.
    if (UI_TEST_FORCE_DASHBOARD_ERROR !== 'YES') {
      setRetryRequested(false);
    }
  }, [refetchSlots, refetchOffers, refetchBookings, forcedErrorConsumed]);

  const activeSlots = React.useMemo(
    () => (slots ?? []).filter((slot) => !slot.isBooked).length,
    [slots]
  );

  const pendingOffers = React.useMemo(
    () => (offers ?? []).filter((offer) => offer.status === 'pending').length,
    [offers]
  );

  const totalBookings = bookings?.length ?? 0;

  const thisMonthRevenue = React.useMemo(() => {
    const now = new Date();

    return (bookings ?? [])
      .filter((booking) => {
        if (booking.status === 'cancelled') {
          return false;
        }

        const createdAt = new Date(booking.createdAt);
        return (
          createdAt.getFullYear() === now.getFullYear() &&
          createdAt.getMonth() === now.getMonth()
        );
      })
      .reduce((sum, booking) => sum + toFiniteNumber(booking.amountCents), 0);
  }, [bookings]);

  const operatorOrgName = React.useMemo(() => {
    return (
      membershipsResponse?.memberships.find((membership) => membership.role === 'operator')
        ?.org?.name ?? 'Operator Team'
    );
  }, [membershipsResponse]);

  const featuredSlots = React.useMemo<SlotData[]>(() => {
    return (slots ?? [])
      .slice()
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      )
      .slice(0, 3)
      .map((slot) => ({
        id: slot.id,
        truckName: `Truck ${slot.truckId.slice(0, 8)}`,
        screenSize: 'N/A',
        region: slot.region,
        date: formatDate(slot.startAt),
        timeWindow: `${formatTime(slot.startAt)}-${formatTime(slot.endAt)}`,
        price: 0,
        status: slot.isBooked ? 'booked' : 'available',
      }));
  }, [slots]);

  // `shouldForceError` is true when a launch arg demands error state, letting
  // LocalAuthE2E tests exercise the error UI without needing the API to fail.
  const shouldForceError =
    UI_TEST_FORCE_DASHBOARD_ERROR === 'YES' ||
    (UI_TEST_FORCE_DASHBOARD_ERROR_ONCE === 'YES' && !forcedErrorConsumed);

  const hasError = shouldForceError || Boolean(slotsError || offersError || bookingsError);

  // In UI-test fake-auth mode the API server is unavailable, so queries will
  // sit in a loading/paused state. Skip the loading gate so the dashboard
  // renders immediately and the test can find operator-dashboard.
  if (isSlotsLoading && !slots && UI_TEST_FAKE_AUTH !== 'YES') {
    return (
      <SafeAreaView
        testID="operator-dashboard-loading"
        accessibilityLabel="operator-dashboard-loading"
        style={styles.safeArea}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading operator dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      testID="operator-dashboard"
      accessibilityLabel="operator-dashboard"
      style={styles.safeArea}
    >
      <ScrollView
        testID="operator-dashboard-scroll"
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing || isSlotsFetching || isOffersFetching || isBookingsFetching
            }
            onRefresh={onRefresh}
          />
        }
      >
        <View
          testID="operator-dashboard-ready"
          accessibilityLabel="operator-dashboard-ready"
          accessible
          style={styles.readyMarker}
        />

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.orgName}>{operatorOrgName}</Text>
            <Text style={styles.userName}>{session?.user.displayName}</Text>
          </View>
          <TouchableOpacity
            testID="logout-button"
            accessibilityLabel="logout-button"
            style={styles.logoutButton}
            onPress={() => void logout()}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {hasError ? (
          <View
            testID="operator-dashboard-error"
            accessibilityLabel="operator-dashboard-error"
            style={styles.errorCard}
          >
            <Text style={styles.errorTitle}>Some dashboard data failed to load.</Text>
            {retryRequested ? (
              <View
                testID="operator-dashboard-retry-requested"
                accessibilityLabel="operator-dashboard-retry-requested"
              >
                <Text style={styles.errorSubtitle}>Retrying…</Text>
              </View>
            ) : (
              <Text style={styles.errorSubtitle}>Tap Retry or pull down to refresh.</Text>
            )}
            <TouchableOpacity
              testID="operator-dashboard-retry-button"
              accessibilityLabel="operator-dashboard-retry-button"
              style={styles.retryButton}
              onPress={() => void handleRetry()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiItem}>
              <KPICard
                iconSource={loadingAnimation}
                label="Active Slots"
                value={activeSlots}
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
                label="Bookings"
                value={totalBookings}
              />
            </View>
            <View style={styles.kpiItem}>
              <KPICard
                iconSource={loadingAnimation}
                label="This Month"
                value={formatCurrencyFromCents(thisMonthRevenue)}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Slots</Text>

          {featuredSlots.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No slots found yet.</Text>
              <Text style={styles.emptySubtext}>
                Use the Slots tab to create your first availability window.
              </Text>
            </View>
          ) : (
            featuredSlots.map((slot) => <SlotCard key={slot.id} slot={slot} />)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Data Source</Text>
          <Text style={styles.metaText}>Slots: `/slots/search`</Text>
          <Text style={styles.metaText}>Offers: `/offers`</Text>
          <Text style={styles.metaText}>Bookings: `/bookings`</Text>
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
  readyMarker: {
    width: 1,
    height: 1,
    opacity: 0.01,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
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
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  orgName: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  userName: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  logoutButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  errorCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    gap: 2,
  },
  errorTitle: {
    color: '#b91c1c',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  errorSubtitle: {
    color: '#b91c1c',
    fontSize: theme.fontSize.xs,
  },
  retryButton: {
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#b91c1c',
  },
  retryButtonText: {
    color: '#b91c1c',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.muted,
    gap: theme.spacing.xs,
  },
  emptyText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
  emptySubtext: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  metaText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
    marginBottom: 4,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
