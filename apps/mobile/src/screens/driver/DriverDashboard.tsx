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
import { useBookings } from '@/hooks';
import { theme } from '@/lib/theme';
import loadingAnimation from '@/assets/lottie/icons/loading.json';

export const DriverDashboard = () => {
  const { session, logout } = useAuth();
  const {
    data: bookings,
    isLoading,
    isFetching,
    refetch,
  } = useBookings({ refetchInterval: 8000 });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const runCount = React.useMemo(
    () =>
      (bookings ?? []).filter((booking) =>
        ['confirmed', 'running', 'awaiting_review'].includes(booking.status)
      ).length,
    [bookings]
  );

  const runningCount = React.useMemo(
    () => (bookings ?? []).filter((booking) => booking.status === 'running').length,
    [bookings]
  );

  const reviewCount = React.useMemo(
    () =>
      (bookings ?? []).filter((booking) => booking.status === 'awaiting_review').length,
    [bookings]
  );

  const completedCount = React.useMemo(
    () => (bookings ?? []).filter((booking) => booking.status === 'completed').length,
    [bookings]
  );

  if (isLoading && !bookings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading driver dashboard...</Text>
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
        <View style={styles.header}>
          <View>
            <Text style={styles.role}>Driver Console</Text>
            <Text style={styles.name}>{session?.user.displayName}</Text>
            <Text style={styles.meta}>Assigned booking view updates every 8s</Text>
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
                label="Assigned Runs"
                value={runCount}
              />
            </View>
            <View style={styles.kpiItem}>
              <KPICard
                iconSource={loadingAnimation}
                label="Running"
                value={runningCount}
              />
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiItem}>
              <KPICard
                iconSource={loadingAnimation}
                label="Awaiting Review"
                value={reviewCount}
              />
            </View>
            <View style={styles.kpiItem}>
              <KPICard
                iconSource={loadingAnimation}
                label="Completed"
                value={completedCount}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Assignment Snapshot</Text>
          {(bookings ?? []).length === 0 ? (
            <Text style={styles.emptyText}>No driver assignments yet.</Text>
          ) : (
            (bookings ?? []).slice(0, 3).map((booking) => (
              <View key={booking.id} style={styles.card}>
                <Text style={styles.cardTitle}>Booking {booking.id.slice(0, 8)}</Text>
                <Text style={styles.cardMeta}>Status: {booking.status}</Text>
                <Text style={styles.cardMeta}>Region: {booking.slot?.region ?? 'Unknown'}</Text>
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
  role: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  name: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  meta: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
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
  sectionTitle: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  kpiItem: {
    flex: 1,
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
  emptyText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
