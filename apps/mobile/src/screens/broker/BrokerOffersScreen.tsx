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
import { useOffers } from '@/hooks';
import { useAuth } from '@/auth';
import { formatCurrencyFromCents } from '@/lib/format';
import { theme } from '@/lib/theme';

export const BrokerOffersScreen = () => {
  const { session } = useAuth();

  const {
    data: offers,
    isLoading,
    isFetching,
    refetch,
  } = useOffers(undefined, { refetchInterval: 10000 });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const myOffers = React.useMemo(
    () =>
      (offers ?? []).filter((offer) => offer.createdBy === session?.user.id),
    [offers, session?.user.id]
  );

  const grouped = React.useMemo(() => {
    return {
      pending: myOffers.filter((offer) => offer.status === 'pending').length,
      countered: myOffers.filter((offer) => offer.status === 'countered').length,
      accepted: myOffers.filter((offer) => offer.status === 'accepted').length,
      rejected: myOffers.filter((offer) => offer.status === 'rejected').length,
      expired: myOffers.filter((offer) => offer.status === 'expired').length,
    };
  }, [myOffers]);

  if (isLoading && !offers) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading offers...</Text>
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
          <Text style={styles.sectionTitle}>Offer Lifecycle Tracking</Text>
          <Text style={styles.helper}>Realtime refresh every 10 seconds.</Text>

          <View style={styles.metricsRow}>
            <Text style={styles.metric}>Pending: {grouped.pending}</Text>
            <Text style={styles.metric}>Countered: {grouped.countered}</Text>
          </View>
          <View style={styles.metricsRow}>
            <Text style={styles.metric}>Accepted: {grouped.accepted}</Text>
            <Text style={styles.metric}>Rejected: {grouped.rejected}</Text>
            <Text style={styles.metric}>Expired: {grouped.expired}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Offers</Text>

          {myOffers.length === 0 ? (
            <Text style={styles.emptyText}>No offers yet.</Text>
          ) : (
            myOffers
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              .map((offer) => (
                <View key={offer.id} style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {formatCurrencyFromCents(offer.amountCents, offer.currency)}
                  </Text>
                  <Text style={styles.cardMeta}>Status: {offer.status}</Text>
                  <Text style={styles.cardMeta}>Request: {offer.requestId ?? 'N/A'}</Text>
                  <Text style={styles.cardMeta}>Slot: {offer.slotId ?? 'N/A'}</Text>
                  <Text style={styles.cardMeta}>Offer ID: {offer.id}</Text>
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
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  metric: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
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
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
