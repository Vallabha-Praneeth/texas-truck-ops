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
import {
  useCreateRequest,
  useDeleteRequest,
  useRequests,
} from '@/hooks';
import { useAuth } from '@/auth';
import { theme } from '@/lib/theme';

const oneDayMs = 24 * 60 * 60 * 1000;

const getDefaultStartAt = () => new Date(Date.now() + oneDayMs).toISOString();
const getDefaultEndAt = () => new Date(Date.now() + oneDayMs * 2).toISOString();

export const BrokerRequestsScreen = () => {
  const { session } = useAuth();

  const {
    data: requests,
    isLoading,
    isFetching,
    refetch,
  } = useRequests();

  const createRequest = useCreateRequest();
  const deleteRequest = useDeleteRequest();

  const [title, setTitle] = React.useState('Campaign Request');
  const [region, setRegion] = React.useState('DFW');
  const [description, setDescription] = React.useState('Need LED truck inventory.');
  const [preferredStartAt, setPreferredStartAt] = React.useState(getDefaultStartAt);
  const [preferredEndAt, setPreferredEndAt] = React.useState(getDefaultEndAt);
  const [budgetCents, setBudgetCents] = React.useState('120000');
  const [minScreenWidthFt, setMinScreenWidthFt] = React.useState('10');
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const myRequests = React.useMemo(
    () =>
      (requests ?? []).filter(
        (request) => request.createdBy === session?.user.id
      ),
    [requests, session?.user.id]
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreateRequest = async () => {
    setActionError(null);

    const startDate = new Date(preferredStartAt);
    const endDate = new Date(preferredEndAt);

    if (!title.trim()) {
      setActionError('Title is required.');
      return;
    }

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setActionError('Preferred start/end must be valid ISO timestamps.');
      return;
    }

    if (endDate <= startDate) {
      setActionError('Preferred end must be after preferred start.');
      return;
    }

    const budget = Number(budgetCents);
    if (!Number.isFinite(budget) || budget <= 0) {
      setActionError('Budget (cents) must be a positive number.');
      return;
    }

    try {
      await createRequest.mutateAsync({
        title: title.trim(),
        region: region.trim(),
        description: description.trim(),
        preferredStartAt: startDate.toISOString(),
        preferredEndAt: endDate.toISOString(),
        budgetCents: budget,
        minScreenWidthFt: minScreenWidthFt.trim() || undefined,
      });

      setTitle('Campaign Request');
      setDescription('Need LED truck inventory.');
      setPreferredStartAt(getDefaultStartAt());
      setPreferredEndAt(getDefaultEndAt());
    } catch (createError) {
      setActionError(
        createError instanceof Error ? createError.message : 'Failed to create request.'
      );
    }
  };

  const handleDeleteRequest = (requestId: string) => {
    Alert.alert('Delete Request', 'Delete this broker request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteRequest.mutateAsync(requestId).catch((deleteError) => {
            setActionError(
              deleteError instanceof Error
                ? deleteError.message
                : 'Failed to delete request.'
            );
          });
        },
      },
    ]);
  };

  if (isLoading && !requests) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
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
          <Text style={styles.sectionTitle}>Create Request</Text>
          <Text style={styles.helper}>Uses `POST /requests`.</Text>

          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />

          <Text style={styles.fieldLabel}>Region</Text>
          <TextInput style={styles.input} value={region} onChangeText={setRegion} />

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.fieldLabel}>Preferred Start (ISO)</Text>
          <TextInput
            style={styles.input}
            value={preferredStartAt}
            onChangeText={setPreferredStartAt}
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>Preferred End (ISO)</Text>
          <TextInput
            style={styles.input}
            value={preferredEndAt}
            onChangeText={setPreferredEndAt}
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>Budget (cents)</Text>
          <TextInput
            style={styles.input}
            value={budgetCents}
            onChangeText={setBudgetCents}
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>Min Screen Width (ft)</Text>
          <TextInput
            style={styles.input}
            value={minScreenWidthFt}
            onChangeText={setMinScreenWidthFt}
          />

          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => void handleCreateRequest()}
            disabled={createRequest.isPending}
          >
            <Text style={styles.primaryButtonText}>
              {createRequest.isPending ? 'Creating...' : 'Create Request'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Requests</Text>

          {myRequests.length === 0 ? (
            <Text style={styles.emptyText}>No broker requests yet.</Text>
          ) : (
            myRequests
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              .map((request) => (
                <View key={request.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{request.title}</Text>
                  <Text style={styles.cardMeta}>Region: {request.region}</Text>
                  <Text style={styles.cardMeta}>Status: {request.status}</Text>
                  <Text style={styles.cardMeta}>Budget: {request.budgetCents ?? 0}</Text>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteRequest(request.id)}
                    disabled={deleteRequest.isPending}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: theme.colors.destructive,
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
    fontSize: theme.fontSize.sm,
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
  emptyText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});
