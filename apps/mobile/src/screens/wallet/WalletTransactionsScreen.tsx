import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useWalletTransactions, type WalletTransaction } from '@/hooks';
import { formatCurrencyFromCents } from '@/lib/format';
import { theme } from '@/lib/theme';

type TransactionStatus = 'all' | 'pending' | 'completed' | 'failed';

const TRANSACTION_LIMIT = 20;

export const WalletTransactionsScreen = () => {
  const [statusFilter, setStatusFilter] = React.useState<TransactionStatus>('all');
  const [offset, setOffset] = React.useState(0);

  const {
    data: transactions,
    isLoading,
    isFetching,
    refetch,
  } = useWalletTransactions(
    { limit: TRANSACTION_LIMIT, offset },
    { refetchInterval: 30000 }
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setOffset(0);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];
    if (statusFilter === 'all') return transactions;
    return transactions.filter((tx) => tx.status === statusFilter);
  }, [transactions, statusFilter]);

  const getTransactionColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'deposit':
      case 'payout':
      case 'credit':
        return theme.colors.success;
      case 'fee':
      case 'charge':
      case 'debit':
        return theme.colors.destructive;
      default:
        return theme.colors.foreground;
    }
  };

  const getTransactionSign = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'deposit':
      case 'payout':
      case 'credit':
        return '+';
      case 'fee':
      case 'charge':
      case 'debit':
        return '-';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const color = getTransactionColor(item.type);
    const sign = getTransactionSign(item.type);

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>{item.type}</Text>
            <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <Text style={[styles.transactionAmount, { color }]}>
            {sign}
            {formatCurrencyFromCents(Math.abs(item.amount))}
          </Text>
        </View>

        <View style={styles.transactionMeta}>
          <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
            <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
              {item.status}
            </Text>
          </View>
          {item.bookingId && (
            <Text style={styles.bookingId}>Booking: {item.bookingId.slice(0, 8)}</Text>
          )}
        </View>
      </View>
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { backgroundColor: theme.colors.success + '20' };
      case 'pending':
        return { backgroundColor: theme.colors.warning + '20' };
      case 'failed':
        return { backgroundColor: theme.colors.destructive + '20' };
      default:
        return { backgroundColor: theme.colors.muted };
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { color: theme.colors.success };
      case 'pending':
        return { color: theme.colors.warning };
      case 'failed':
        return { color: theme.colors.destructive };
      default:
        return { color: theme.colors.mutedForeground };
    }
  };

  const renderFilterButton = (filter: TransactionStatus, label: string) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        statusFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setStatusFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          statusFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading && !transactions) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('pending', 'Pending')}
          {renderFilterButton('completed', 'Completed')}
          {renderFilterButton('failed', 'Failed')}
        </View>

        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isFetching}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {statusFilter === 'all'
                  ? 'No transactions yet'
                  : `No ${statusFilter} transactions`}
              </Text>
            </View>
          }
        />
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
    fontSize: theme.fontSize.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.muted,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.mutedForeground,
  },
  filterButtonTextActive: {
    color: theme.colors.primaryForeground,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  transactionCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  transactionAmount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    textTransform: 'capitalize',
  },
  bookingId: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.base,
  },
});
