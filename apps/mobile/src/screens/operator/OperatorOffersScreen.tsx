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
import { useOffers, useUpdateOfferStatus } from '@/hooks';
import { formatCurrencyFromCents } from '@/lib/format';
import { theme } from '@/lib/theme';

export const OperatorOffersScreen = () => {
  const {
    data: offers,
    isLoading,
    isFetching,
    refetch,
  } = useOffers();

  const updateStatus = useUpdateOfferStatus();

  const [actionError, setActionError] = React.useState<string | null>(null);
  const [activeOfferId, setActiveOfferId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sortedOffers = React.useMemo(() => {
    return (offers ?? [])
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [offers]);

  const handleStatusChange = async (id: string, status: 'accepted' | 'rejected') => {
    setActionError(null);
    setActiveOfferId(id);

    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (statusError) {
      setActionError(
        statusError instanceof Error ? statusError.message : 'Failed to update offer status.'
      );
    } finally {
      setActiveOfferId(null);
    }
  };

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
          <Text style={styles.sectionTitle}>Offer Inbox</Text>
          <Text style={styles.helper}>Uses `GET /offers` and `PATCH /offers/:id`.</Text>

          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

          {sortedOffers.length === 0 ? (
            <Text style={styles.emptyHint}>No offers found.</Text>
          ) : (
            sortedOffers.map((offer) => {
              const pending = offer.status === 'pending';
              const isSubmitting = activeOfferId === offer.id;

              return (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerHeader}>
                    <Text style={styles.offerAmount}>
                      {formatCurrencyFromCents(offer.amountCents, offer.currency)}
                    </Text>
                    <Text style={styles.offerStatus}>{offer.status}</Text>
                  </View>

                  <Text style={styles.offerMeta}>Offer ID: {offer.id}</Text>
                  <Text style={styles.offerMeta}>Slot ID: {offer.slotId ?? 'N/A'}</Text>
                  <Text style={styles.offerMeta}>Request ID: {offer.requestId ?? 'N/A'}</Text>

                  {pending ? (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => void handleStatusChange(offer.id, 'accepted')}
                        disabled={isSubmitting}
                      >
                        <Text style={styles.acceptButtonText}>
                          {isSubmitting ? 'Saving...' : 'Accept'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => void handleStatusChange(offer.id, 'rejected')}
                        disabled={isSubmitting}
                      >
                        <Text style={styles.rejectButtonText}>
                          {isSubmitting ? 'Saving...' : 'Reject'}
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
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  emptyHint: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  offerCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    gap: 4,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerAmount: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
  offerStatus: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
    textTransform: 'capitalize',
  },
  offerMeta: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#047857',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#b91c1c',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
