import React from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDeleteSlot, useCreateSlot, useSlots, useTrucks, useMemberships } from '@/hooks';
import { theme } from '@/lib/theme';

const oneHourMs = 60 * 60 * 1000;

const getDefaultStartAt = () => new Date(Date.now() + oneHourMs).toISOString();
const getDefaultEndAt = () => new Date(Date.now() + oneHourMs * 3).toISOString();

export const OperatorSlotsScreen = () => {
  const {
    data: slots,
    isLoading: isSlotsLoading,
    isFetching: isSlotsFetching,
    refetch: refetchSlots,
  } = useSlots();
  const { data: trucks, isFetching: isTrucksFetching, refetch: refetchTrucks } = useTrucks();
  const { data: membershipsResponse } = useMemberships();

  const createSlot = useCreateSlot();
  const deleteSlot = useDeleteSlot();

  const [selectedTruckId, setSelectedTruckId] = React.useState('');
  const [region, setRegion] = React.useState('DFW');
  const [startAt, setStartAt] = React.useState(getDefaultStartAt);
  const [endAt, setEndAt] = React.useState(getDefaultEndAt);
  const [radiusMiles, setRadiusMiles] = React.useState('25');
  const [notes, setNotes] = React.useState('');
  const [actionError, setActionError] = React.useState<string | null>(null);

  const [refreshing, setRefreshing] = React.useState(false);

  const operatorOrgIds = React.useMemo(() => {
    return new Set(
      (membershipsResponse?.memberships ?? [])
        .filter((membership) => membership.role === 'operator')
        .map((membership) => membership.orgId)
    );
  }, [membershipsResponse]);

  const operatorTrucks = React.useMemo(() => {
    const allTrucks = trucks ?? [];
    if (operatorOrgIds.size === 0) {
      return allTrucks;
    }

    return allTrucks.filter((truck) => operatorOrgIds.has(truck.orgId));
  }, [trucks, operatorOrgIds]);

  React.useEffect(() => {
    if (!selectedTruckId && operatorTrucks.length > 0) {
      setSelectedTruckId(operatorTrucks[0].id);
    }
  }, [selectedTruckId, operatorTrucks]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSlots(), refetchTrucks()]);
    setRefreshing(false);
  }, [refetchSlots, refetchTrucks]);

  const handleCreateSlot = async () => {
    setActionError(null);

    if (!selectedTruckId) {
      setActionError('Select a truck before creating a slot.');
      return;
    }

    const radius = Number(radiusMiles);
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (!Number.isFinite(radius) || radius <= 0) {
      setActionError('Radius must be a positive number.');
      return;
    }

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setActionError('Start and end values must be valid ISO timestamps.');
      return;
    }

    if (endDate <= startDate) {
      setActionError('End time must be after start time.');
      return;
    }

    try {
      await createSlot.mutateAsync({
        truckId: selectedTruckId,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        region,
        radiusMiles: radius,
        repositionAllowed: false,
        maxRepositionMiles: 0,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      setNotes('');
      setStartAt(getDefaultStartAt());
      setEndAt(getDefaultEndAt());
    } catch (createError) {
      setActionError(
        createError instanceof Error ? createError.message : 'Failed to create slot.'
      );
    }
  };

  const handleDeleteSlot = (slotId: string) => {
    Alert.alert('Delete Slot', 'Delete this slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteSlot.mutateAsync(slotId).catch((deleteError) => {
            setActionError(
              deleteError instanceof Error
                ? deleteError.message
                : 'Failed to delete slot.'
            );
          });
        },
      },
    ]);
  };

  const sortedSlots = React.useMemo(() => {
    return (slots ?? [])
      .slice()
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [slots]);

  if (isSlotsLoading && !slots) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading slots...</Text>
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
            refreshing={refreshing || isSlotsFetching || isTrucksFetching}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Availability Slot</Text>
          <Text style={styles.helper}>Uses `POST /slots` with operator auth.</Text>

          <Text style={styles.fieldLabel}>Truck</Text>
          {operatorTrucks.length === 0 ? (
            <Text style={styles.emptyHint}>
              No trucks found for your operator org membership.
            </Text>
          ) : (
            <View style={styles.truckList}>
              {operatorTrucks.map((truck) => {
                const selected = truck.id === selectedTruckId;
                return (
                  <TouchableOpacity
                    key={truck.id}
                    style={[styles.truckChip, selected && styles.truckChipSelected]}
                    onPress={() => setSelectedTruckId(truck.id)}
                  >
                    <Text
                      style={[
                        styles.truckChipText,
                        selected && styles.truckChipTextSelected,
                      ]}
                    >
                      {truck.nickname} ({truck.plateNumber})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.fieldLabel}>Region</Text>
          <TextInput style={styles.input} value={region} onChangeText={setRegion} />

          <Text style={styles.fieldLabel}>Start (ISO)</Text>
          <TextInput
            style={styles.input}
            value={startAt}
            onChangeText={setStartAt}
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>End (ISO)</Text>
          <TextInput
            style={styles.input}
            value={endAt}
            onChangeText={setEndAt}
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>Radius Miles</Text>
          <TextInput
            style={styles.input}
            value={radiusMiles}
            onChangeText={setRadiusMiles}
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput style={styles.input} value={notes} onChangeText={setNotes} />

          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => void handleCreateSlot()}
            disabled={createSlot.isPending}
          >
            <Text style={styles.primaryButtonText}>
              {createSlot.isPending ? 'Creating...' : 'Create Slot'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Existing Slots</Text>

          {sortedSlots.length === 0 ? (
            <Text style={styles.emptyHint}>No slots yet.</Text>
          ) : (
            sortedSlots.map((slot) => (
              <View key={slot.id} style={styles.slotCard}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotRegion}>{slot.region}</Text>
                  <Text style={styles.slotStatus}>{slot.isBooked ? 'Booked' : 'Available'}</Text>
                </View>

                <Text style={styles.slotMeta}>Truck: {slot.truckId}</Text>
                <Text style={styles.slotMeta}>Start: {slot.startAt}</Text>
                <Text style={styles.slotMeta}>End: {slot.endAt}</Text>

                {!slot.isBooked ? (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteSlot(slot.id)}
                    disabled={deleteSlot.isPending}
                  >
                    <Text style={styles.deleteButtonText}>Delete Slot</Text>
                  </TouchableOpacity>
                ) : null}
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
  truckList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  truckChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  truckChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  truckChipText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.xs,
  },
  truckChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  primaryButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  primaryButtonText: {
    color: theme.colors.primaryForeground,
    fontWeight: theme.fontWeight.semibold,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  emptyHint: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  slotCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    gap: 4,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotRegion: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
  slotStatus: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  slotMeta: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
  },
  deleteButton: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.destructive,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: theme.colors.destructive,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.xs,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
