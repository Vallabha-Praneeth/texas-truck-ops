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
  useBookings,
  useUpdateBookingStatus,
  useUpdateDriverLocation,
} from '@/hooks';
import { theme } from '@/lib/theme';

export const DriverProofCaptureScreen = () => {
  const {
    data: bookings,
    isLoading,
    isFetching,
    refetch,
  } = useBookings({ refetchInterval: 8000 });

  const updateBookingStatus = useUpdateBookingStatus();
  const updateDriverLocation = useUpdateDriverLocation();

  const [selectedBookingId, setSelectedBookingId] = React.useState('');
  const [proofNote, setProofNote] = React.useState('Proof captured and submitted from mobile.');
  const [latitude, setLatitude] = React.useState('30.2672');
  const [longitude, setLongitude] = React.useState('-97.7431');
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const runningBookings = React.useMemo(
    () => (bookings ?? []).filter((booking) => booking.status === 'running'),
    [bookings]
  );

  React.useEffect(() => {
    if (!selectedBookingId && runningBookings.length > 0) {
      setSelectedBookingId(runningBookings[0].id);
    }
  }, [selectedBookingId, runningBookings]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSubmitProof = async () => {
    setActionError(null);
    setSuccessMessage(null);

    if (!selectedBookingId) {
      setActionError('Select a running booking first.');
      return;
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      setActionError('Latitude and longitude must be valid numbers.');
      return;
    }

    try {
      await updateDriverLocation.mutateAsync({
        bookingId: selectedBookingId,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        isOnline: true,
      });

      await updateBookingStatus.mutateAsync({
        id: selectedBookingId,
        status: 'awaiting_review',
      });

      setSuccessMessage(
        `Proof submitted for booking ${selectedBookingId.slice(0, 8)}. Status moved to awaiting_review.`
      );
      setProofNote('Proof captured and submitted from mobile.');
      await refetch();
    } catch (proofError) {
      setActionError(
        proofError instanceof Error
          ? proofError.message
          : 'Failed to submit proof flow.'
      );
    }
  };

  if (isLoading && !bookings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading proof workflow...</Text>
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
          <Text style={styles.sectionTitle}>Proof Capture Flow</Text>
          <Text style={styles.helper}>
            Submit proof by updating driver location and transitioning booking to
            `awaiting_review`.
          </Text>

          <Text style={styles.fieldLabel}>Running Booking</Text>
          {runningBookings.length === 0 ? (
            <Text style={styles.emptyText}>No running bookings available for proof submission.</Text>
          ) : (
            <View style={styles.bookingList}>
              {runningBookings.map((booking) => {
                const selected = booking.id === selectedBookingId;
                return (
                  <TouchableOpacity
                    key={booking.id}
                    style={[styles.bookingChip, selected && styles.bookingChipSelected]}
                    onPress={() => setSelectedBookingId(booking.id)}
                  >
                    <Text
                      style={[
                        styles.bookingChipText,
                        selected && styles.bookingChipTextSelected,
                      ]}
                    >
                      {booking.id.slice(0, 8)} ({booking.slot?.region ?? 'Unknown'})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.fieldLabel}>Proof Note (captured in app log)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={proofNote}
            onChangeText={setProofNote}
            multiline
          />

          <Text style={styles.fieldLabel}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="decimal-pad"
          />

          <Text style={styles.fieldLabel}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="decimal-pad"
          />

          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => void handleSubmitProof()}
            disabled={
              updateBookingStatus.isPending ||
              updateDriverLocation.isPending ||
              !selectedBookingId
            }
          >
            <Text style={styles.primaryButtonText}>
              {updateBookingStatus.isPending || updateDriverLocation.isPending
                ? 'Submitting...'
                : 'Submit Proof'}
            </Text>
          </TouchableOpacity>
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bookingList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  bookingChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  bookingChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}12`,
  },
  bookingChipText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.xs,
  },
  bookingChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  emptyText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  successText: {
    color: '#047857',
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
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
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
