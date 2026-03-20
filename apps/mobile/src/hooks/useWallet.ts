import {
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/api';

export type WalletBalance = {
  balance: number;
  pendingBalance: number;
};

export type WalletTransaction = {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  bookingId?: string;
};

export const walletKeys = {
  all: ['wallet'] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
  transactions: () => [...walletKeys.all, 'transactions'] as const,
  transactionsList: (params?: { limit?: number; offset?: number }) =>
    [...walletKeys.transactions(), params] as const,
};

export function useWalletBalance(
  options?: Omit<UseQueryOptions<WalletBalance>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: () => api.wallet.getBalance(),
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

export function useWalletTransactions(
  params?: { limit?: number; offset?: number },
  options?: Omit<UseQueryOptions<WalletTransaction[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: walletKeys.transactionsList(params),
    queryFn: () => api.wallet.getTransactions(params),
    staleTime: 20000, // 20 seconds
    ...options,
  });
}
