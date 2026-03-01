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
import {
  useCreateOffer,
  useRequests,
  useSlots,
} from '@/hooks';
import { useAuth } from '@/auth';
import { theme } from '@/lib/theme';

export const BrokerMarketplaceScreen = () => {
  const { session } = useAuth();

  const {
    data: slots,
    isLoading: slotsLoading,
    isFetching: slotsFetching,
    refetch: refetchSlots,
  } = useSlots(undefined, { refetchInterval: 10000 });

  const {
    data: requests,
    isFetching: requestsFetching,
    refetch: refetchRequests,
  } = useRequests(undefined, { refetchInterval: 15000 });

  const createOffer = useCreateOffer();

  const [selectedRequestId, setSelectedRequestId] = React.useState('');
  const [amountCents, setAmountCents] = React.useState('120000');
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const myRequests = React.useMemo(
    () =>
      (requests ?? []).filter(
        (request) => request.createdBy === session?.user.id
      ),
    [requests, session?.user.id]
  );

  React.useEffect(() => {
    if (!selectedRequestId && myRequests.length > 0) {
      setSelectedRequestId(myRequests[0].id);
    }
  }, [selectedRequestId, myRequests]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSlots(), refetchRequests()]);
    setRefreshing(false);
  }, [refetchSlots, refetchRequests]);

  const handleSendOffer = async (slotId: string) => {
    setActionError(null);

    if (!selectedRequestId) {
      setActionError('Select a request before sending an offer.');
      return;
    }

    const amount = Number(amountCents);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Offer amount must be a positive number.');
      return;
    }

    try {
      await createOffer.mutateAsync({
        requestId: selectedRequestId,
        slotId,
        amountCents: amount,
        currency: 'USD',
      });
    } catch (offerError) {
      setActionError(
        offerError instanceof Error ? offerError.message : 'Failed to send offer.'
      );
    }
  };

  if (slotsLoading && !slots) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading marketplace...</Text>
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
            refreshing={refreshing || slotsFetching || requestsFetching}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketplace Offer Send</Text>
          <Text style={styles.helper}>
            Search slots and send offers linked to your selected request.
          </Text>

          <Text style={styles.fieldLabel}>Select Request</Text>
          {myRequests.length === 0 ? (
            <Text style={styles.emptyText}>Create a request first in Requests tab.</Text>
          ) : (
            <View style={styles.requestList}>
              {myRequests.map((request) => {
                const selected = request.id === selectedRequestId;
                return (
                  <TouchableOpacity
                    key={request.id}
                    style={[styles.requestChip, selected && styles.requestChipSelected]}
                    onPress={() => setSelectedRequestId(request.id)}
                  >
                    <Text
                      style={[
                        styles.requestChipText,
                        selected && styles.requestChipTextSelected,
                      ]}
                    >
                      {request.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.fieldLabel}>Offer Amount (cents)</Text>
          <TextInput
            style={styles.input}
            value={amountCents}
            onChangeText={setAmountCents}
            keyboardType="number-pad"
          />

          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Slots</Text>

          {(slots ?? []).length === 0 ? (
            <Text style={styles.emptyText}>No slots currently available.</Text>
          ) : (
            (slots ?? [])
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
              )
              .map((slot) => (
                <View key={slot.id} style={styles.slotCard}>
                  <Text style={styles.slotTitle}>{slot.region}</Text>
                  <Text style={styles.slotMeta}>Slot ID: {slot.id}</Text>
                  <Text style={styles.slotMeta}>Truck ID: {slot.truckId}</Text>
                  <Text style={styles.slotMeta}>Start: {slot.startAt}</Text>
                  <Text style={styles.slotMeta}>End: {slot.endAt}</Text>

                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={() => void handleSendOffer(slot.id)}
                    disabled={createOffer.isPending || !selectedRequestId}
                  >
                    <Text style={styles.sendButtonText}>
                      {createOffer.isPending ? 'Sending...' : 'Send Offer'}
                    </Text>
                  </TouchableOpacity>
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
  fieldLabel: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    marginBottom: 6,
    marginTop: theme.spacing.xs,
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
  requestList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  requestChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  requestChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}12`,
  },
  requestChipText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.xs,
  },
  requestChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
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
  slotCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    gap: 4,
  },
  slotTitle: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
  slotMeta: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
  },
  sendButton: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: theme.colors.primaryForeground,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
