import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatCurrencyFromCents } from '@/lib/format';
import { theme } from '@/lib/theme';
import { useWalletBalance } from '@/hooks';

type WalletBalanceCardProps = {
  onViewTransactions?: () => void;
};

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  onViewTransactions,
}) => {
  const { data: wallet, isLoading, error } = useWalletBalance({ refetchInterval: 30000 });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to load wallet balance</Text>
      </View>
    );
  }

  const availableBalance = wallet?.balance ?? 0;
  const pendingBalance = wallet?.pendingBalance ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <View style={styles.balanceSection}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrencyFromCents(availableBalance)}
          </Text>
        </View>

        {pendingBalance > 0 && (
          <View style={styles.balanceItem}>
            <Text style={styles.pendingLabel}>Pending</Text>
            <Text style={styles.pendingAmount}>
              {formatCurrencyFromCents(pendingBalance)}
            </Text>
          </View>
        )}
      </View>

      {onViewTransactions && (
        <TouchableOpacity style={styles.button} onPress={onViewTransactions}>
          <Text style={styles.buttonText}>View Transactions</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
  },
  balanceSection: {
    marginBottom: theme.spacing.md,
  },
  balanceItem: {
    marginBottom: theme.spacing.xs,
  },
  balanceLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  pendingLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: 2,
  },
  pendingAmount: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.warning,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
});
