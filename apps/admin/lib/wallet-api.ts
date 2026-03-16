// Wallet API client functions
import { apiRequest, buildQueryString } from './api-client';
import type {
  WalletTransaction,
  TransactionType,
  TransactionStatus,
} from '@led-billboard/shared';

export interface WalletBalance {
  userId: string;
  balance: string;
  balanceCents: number;
}

export interface TransactionListParams {
  type?: TransactionType;
  status?: TransactionStatus;
  limit?: number;
  offset?: number;
}

export interface TransactionListResponse {
  transactions: WalletTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface PlatformStats {
  totalRevenue: string;
  totalRevenueCents: number;
  totalPayouts: string;
  totalPayoutsCents: number;
  pendingDeposits: string;
  pendingDepositsCents: number;
  successRate: number;
  totalTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
}

/**
 * Get wallet balance for the current user
 */
export async function getWalletBalance(): Promise<WalletBalance> {
  return apiRequest<WalletBalance>('/wallet/balance');
}

/**
 * Get transactions with filtering and pagination
 */
export async function getTransactions(
  params: TransactionListParams = {}
): Promise<TransactionListResponse> {
  const queryString = buildQueryString(params);
  return apiRequest<TransactionListResponse>(`/wallet/transactions${queryString}`);
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(id: string): Promise<WalletTransaction> {
  return apiRequest<WalletTransaction>(`/wallet/transactions/${id}`);
}

/**
 * Get all transactions for a specific booking
 */
export async function getBookingTransactions(
  bookingId: string
): Promise<WalletTransaction[]> {
  return apiRequest<WalletTransaction[]>(`/wallet/bookings/${bookingId}/transactions`);
}

/**
 * Format cents to USD string
 */
export function formatCurrency(cents: number | string): string {
  const numCents = typeof cents === 'string' ? parseFloat(cents) : cents;
  const dollars = numCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Get transaction type label
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    refund: 'Refund',
    payout: 'Payout',
    platform_fee: 'Platform Fee',
  };
  return labels[type] || type;
}

/**
 * Get transaction status color
 */
export function getTransactionStatusColor(
  status: TransactionStatus
): 'default' | 'success' | 'destructive' {
  const colors: Record<TransactionStatus, 'default' | 'success' | 'destructive'> = {
    pending: 'default',
    completed: 'success',
    failed: 'destructive',
  };
  return colors[status] || 'default';
}
