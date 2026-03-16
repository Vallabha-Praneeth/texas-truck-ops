'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WalletTransaction } from '@led-billboard/shared';
import {
  getBookingTransactions,
  formatCurrency,
  getTransactionTypeLabel,
  getTransactionStatusColor,
} from '@/lib/wallet-api';

interface BookingPaymentHistoryProps {
  bookingId: string;
  onTransactionClick?: (transaction: WalletTransaction) => void;
}

export function BookingPaymentHistory({
  bookingId,
  onTransactionClick,
}: BookingPaymentHistoryProps) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [bookingId]);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getBookingTransactions(bookingId);
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment history');
      console.error('Error loading booking transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return '💰';
      case 'platform_fee':
        return '💳';
      case 'payout':
        return '💸';
      case 'refund':
        return '🔄';
      case 'withdrawal':
        return '🏦';
      default:
        return '💵';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            Loading payment history...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            No payment transactions found for this booking
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Payment Timeline */}
          <div className="relative">
            {transactions.map((transaction, index) => (
              <div key={transaction.id} className="flex gap-4 pb-6 last:pb-0">
                {/* Timeline line */}
                {index < transactions.length - 1 && (
                  <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-slate-200" />
                )}

                {/* Icon */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl">
                  {getTransactionIcon(transaction.type)}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {getTransactionTypeLabel(transaction.type)}
                        </span>
                        <Badge
                          variant={getTransactionStatusColor(transaction.status)}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDate(transaction.createdAt)}
                      </div>
                      {transaction.paymentMethod && (
                        <div className="text-xs text-muted-foreground mt-1">
                          via {transaction.paymentMethod}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatCurrency(transaction.amount)}
                      </div>
                      {onTransactionClick && (
                        <button
                          onClick={() => onTransactionClick(transaction)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          View details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold">Total Transactions:</span>
              <span>{transactions.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold">
                {formatCurrency(
                  transactions.reduce((sum, t) => {
                    const amount = parseFloat(t.amount);
                    return t.status === 'completed' ? sum + amount : sum;
                  }, 0).toString()
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
