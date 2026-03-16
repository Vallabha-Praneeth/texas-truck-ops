'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WalletTransaction } from '@led-billboard/shared';
import {
  getTransactionById,
  formatCurrency,
  getTransactionTypeLabel,
  getTransactionStatusColor,
} from '@/lib/wallet-api';

interface TransactionDetailsModalProps {
  transactionId: string | null;
  open: boolean;
  onClose: () => void;
}

export function TransactionDetailsModal({
  transactionId,
  open,
  onClose,
}: TransactionDetailsModalProps) {
  const [transaction, setTransaction] = useState<WalletTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && transactionId) {
      loadTransaction();
    }
  }, [open, transactionId]);

  const loadTransaction = async () => {
    if (!transactionId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getTransactionById(transactionId);
      setTransaction(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction details');
      console.error('Error loading transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStripeUrl = (paymentIntentId: string) => {
    const isTest = paymentIntentId.startsWith('pi_test_');
    const baseUrl = isTest
      ? 'https://dashboard.stripe.com/test'
      : 'https://dashboard.stripe.com';
    return `${baseUrl}/payments/${paymentIntentId}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center text-muted-foreground">
            Loading transaction details...
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        {!loading && !error && transaction && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(transaction.amount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getTransactionTypeLabel(transaction.type)}
                </div>
              </div>
              <Badge variant={getTransactionStatusColor(transaction.status)}>
                {transaction.status}
              </Badge>
            </div>

            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Transaction ID</div>
                  <div className="font-mono">{transaction.id}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">User ID</div>
                  <div className="font-mono">{transaction.userId}</div>
                </div>
                {transaction.bookingId && (
                  <div>
                    <div className="text-muted-foreground">Booking ID</div>
                    <div className="font-mono">{transaction.bookingId}</div>
                  </div>
                )}
                {transaction.paymentMethod && (
                  <div>
                    <div className="text-muted-foreground">Payment Method</div>
                    <div className="capitalize">{transaction.paymentMethod}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            {transaction.externalTransactionId && (
              <div className="space-y-3">
                <h3 className="font-semibold">Payment Details</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">
                      External Transaction ID
                    </div>
                    <div className="font-mono text-xs break-all">
                      {transaction.externalTransactionId}
                    </div>
                  </div>
                  {transaction.externalTransactionId.startsWith('pi_') && (
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            getStripeUrl(transaction.externalTransactionId!),
                            '_blank'
                          )
                        }
                      >
                        View in Stripe Dashboard
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="space-y-3">
              <h3 className="font-semibold">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Created At</div>
                  <div>{formatDate(transaction.createdAt)}</div>
                </div>
                {transaction.completedAt && (
                  <div>
                    <div className="text-muted-foreground">Completed At</div>
                    <div>{formatDate(transaction.completedAt)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            {transaction.metadata &&
              Object.keys(transaction.metadata).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Additional Metadata</h3>
                  <div className="p-3 bg-slate-50 rounded text-sm font-mono">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(transaction.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
