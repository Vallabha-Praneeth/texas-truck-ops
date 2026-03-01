import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDriverLocation, useUpdateDriverLocation } from '@/hooks';
import { theme } from '@/lib/theme';

export const DriverLocationScreen = () => {
  const { data, isLoading, refetch } = useDriverLocation();
  const { mutateAsync: updateLocation, isPending } = useUpdateDriverLocation();

  const [latitude, setLatitude] = React.useState('30.2672');
  const [longitude, setLongitude] = React.useState('-97.7431');
  const [isOnline, setIsOnline] = React.useState(true);
  const [error, setError] = React.useState('');

  const submit = async () => {
    setError('');

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      setError('Latitude and longitude must be valid numbers.');
      return;
    }

    try {
      await updateLocation({
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        isOnline,
      });
      await refetch();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update location.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Driver Location</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Presence</Text>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={styles.jsonText}>{JSON.stringify(data ?? null, null, 2)}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Update `/drivers/me/location`</Text>

          <TextInput
            style={styles.input}
            value={latitude}
            onChangeText={setLatitude}
            placeholder="Latitude"
            keyboardType="decimal-pad"
          />

          <TextInput
            style={styles.input}
            value={longitude}
            onChangeText={setLongitude}
            placeholder="Longitude"
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[styles.toggleButton, isOnline ? styles.online : styles.offline]}
            onPress={() => setIsOnline((prev) => !prev)}
          >
            <Text style={styles.toggleButtonText}>
              {isOnline ? 'Set Online' : 'Set Offline'}
            </Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.submitButton} onPress={() => void submit()} disabled={isPending}>
            <Text style={styles.submitButtonText}>
              {isPending ? 'Updating...' : 'Update Location'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  sectionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
  },
  jsonText: {
    fontFamily: 'Courier',
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.background,
  },
  toggleButton: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  online: {
    backgroundColor: '#0f766e',
  },
  offline: {
    backgroundColor: '#991b1b',
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: theme.fontWeight.semibold,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.fontSize.sm,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  submitButtonText: {
    color: theme.colors.primaryForeground,
    fontWeight: theme.fontWeight.semibold,
  },
});
