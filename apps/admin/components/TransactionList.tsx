'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { WalletTransaction, TransactionType, TransactionStatus } from '@led-billboard/shared';
import {
  formatCurrency,
  getTransactionTypeLabel,
  getTransactionStatusColor,
} from '@/lib/wallet-api';

interface TransactionListProps {
  transactions: WalletTransaction[];
  loading?: boolean;
  onTransactionClick?: (transaction: WalletTransaction) => void;
  onFilterChange?: (filters: {
    type?: TransactionType | 'all';
    status?: TransactionStatus | 'all';
    search?: string;
  }) => void;
  showFilters?: boolean;
}

export function TransactionList({
  transactions,
  loading,
  onTransactionClick,
  onFilterChange,
  showFilters = true,
}: TransactionListProps) {
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTypeChange = (value: string) => {
    const newType = value as TransactionType | 'all';
    setTypeFilter(newType);
    onFilterChange?.({
      type: newType,
      status: statusFilter,
      search: searchQuery,
    });
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value as TransactionStatus | 'all';
    setStatusFilter(newStatus);
    onFilterChange?.({
      type: typeFilter,
      status: newStatus,
      search: searchQuery,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFilterChange?.({
      type: typeFilter,
      status: statusFilter,
      search: value,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const truncateId = (id: string, length = 8) => {
    return `${id.slice(0, length)}...`;
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by ID, user ID, or booking ID..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="payout">Payout</SelectItem>
              <SelectItem value="platform_fee">Platform Fee</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Booking ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading transactions...
                </TableCell>
              </TableRow>
            )}

            {!loading && transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => onTransactionClick?.(transaction)}
                >
                  <TableCell className="font-mono text-xs">
                    {truncateId(transaction.id)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTransactionStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {truncateId(transaction.userId)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {transaction.bookingId ? truncateId(transaction.bookingId) : '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(transaction.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTransactionClick?.(transaction);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
