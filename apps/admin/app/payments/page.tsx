'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionList } from '@/components/TransactionList';
import { TransactionDetailsModal } from '@/components/TransactionDetailsModal';
import type { WalletTransaction, TransactionType, TransactionStatus } from '@led-billboard/shared';
import {
  getTransactions,
  formatCurrency,
  type TransactionListResponse,
} from '@/lib/wallet-api';

const ITEMS_PER_PAGE = 50;

export default function PaymentsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats state
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPayouts: 0,
    pendingDeposits: 0,
    completedCount: 0,
    failedCount: 0,
    totalCount: 0,
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    loadTransactions();
  }, [currentPage, typeFilter, statusFilter]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadTransactions();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const params: any = {
        limit: ITEMS_PER_PAGE,
        offset,
      };

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const data = await getTransactions(params);

      let filteredTransactions = data.transactions || [];

      // Client-side search filtering
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredTransactions = filteredTransactions.filter(
          (t) =>
            t.id.toLowerCase().includes(query) ||
            t.userId.toLowerCase().includes(query) ||
            (t.bookingId && t.bookingId.toLowerCase().includes(query))
        );
      }

      setTransactions(filteredTransactions);
      setTotalCount(data.total || filteredTransactions.length);

      // Calculate stats from all transactions
      calculateStats(filteredTransactions);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactionList: WalletTransaction[]) => {
    const completed = transactionList.filter((t) => t.status === 'completed');
    const failed = transactionList.filter((t) => t.status === 'failed');
    const pending = transactionList.filter((t) => t.status === 'pending');

    const revenue = completed
      .filter((t) => t.type === 'platform_fee')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const payouts = completed
      .filter((t) => t.type === 'payout')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const pendingDeps = pending
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    setStats({
      totalRevenue: revenue,
      totalPayouts: payouts,
      pendingDeposits: pendingDeps,
      completedCount: completed.length,
      failedCount: failed.length,
      totalCount: transactionList.length,
    });
  };

  const handleTransactionClick = (transaction: WalletTransaction) => {
    setSelectedTransaction(transaction.id);
    setShowDetailsModal(true);
  };

  const handleFilterChange = (filters: {
    type?: TransactionType | 'all';
    status?: TransactionStatus | 'all';
    search?: string;
  }) => {
    if (filters.type !== undefined) setTypeFilter(filters.type);
    if (filters.status !== undefined) setStatusFilter(filters.status);
    if (filters.search !== undefined) setSearchQuery(filters.search);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const successRate =
    stats.totalCount > 0
      ? ((stats.completedCount / stats.totalCount) * 100).toFixed(1)
      : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment Management</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage all platform transactions
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Platform Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue.toString())}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From platform fees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalPayouts.toString())}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paid to operators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Deposits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.pendingDeposits.toString())}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedCount} of {stats.totalCount} transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              View and filter all payment transactions on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionList
              transactions={transactions}
              loading={loading}
              onTransactionClick={handleTransactionClick}
              onFilterChange={handleFilterChange}
              showFilters={true}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{' '}
                  {totalCount} transactions
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-4 text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Details Modal */}
        <TransactionDetailsModal
          transactionId={selectedTransaction}
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTransaction(null);
          }}
        />
      </div>
    </div>
  );
}
