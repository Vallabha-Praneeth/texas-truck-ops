import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WalletTransactionRepository } from './wallet-transaction.repository';
import { TransactionType, TransactionStatus } from '@led-billboard/shared';
import { GetTransactionsDto } from '@led-billboard/shared';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletTransactionRepository: WalletTransactionRepository
  ) {}

  /**
   * Get user's wallet balance
   */
  async getBalance(userId: string) {
    const balance = await this.walletTransactionRepository.calculateBalance(userId);
    const stats = await this.walletTransactionRepository.getStats(userId);

    return {
      balance,
      totalDeposits: stats.totalDeposits,
      totalPayouts: stats.totalPayouts,
      totalWithdrawals: stats.totalWithdrawals,
      totalFees: stats.totalFees,
      pendingTransactions: stats.pendingCount,
    };
  }

  /**
   * Get user's transaction history
   */
  async getTransactions(userId: string, filters: GetTransactionsDto) {
    const transactions = await this.walletTransactionRepository.findByUserId(userId, {
      type: filters.type,
      status: filters.status,
      limit: filters.limit,
      offset: filters.offset,
    });

    return transactions;
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string) {
    const transaction = await this.walletTransactionRepository.findById(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Create a deposit transaction (pending until payment confirmed)
   */
  async createDepositTransaction(
    userId: string,
    bookingId: string,
    amountCents: number,
    externalTransactionId: string,
    metadata?: Record<string, unknown>
  ) {
    // Convert cents to decimal string (e.g., 5000 cents = "50.00")
    const amountDecimal = (amountCents / 100).toFixed(2);

    const transaction = await this.walletTransactionRepository.create({
      userId,
      bookingId,
      amount: amountDecimal,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      paymentMethod: 'stripe',
      externalTransactionId,
      metadata,
    });

    return transaction;
  }

  /**
   * Complete a deposit transaction (called by webhook)
   */
  async completeDeposit(externalTransactionId: string) {
    const transaction = await this.walletTransactionRepository.findByExternalId(
      externalTransactionId
    );

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not pending');
    }

    const updated = await this.walletTransactionRepository.updateStatus(
      transaction.id,
      TransactionStatus.COMPLETED,
      new Date()
    );

    return updated;
  }

  /**
   * Fail a deposit transaction
   */
  async failDeposit(externalTransactionId: string) {
    const transaction = await this.walletTransactionRepository.findByExternalId(
      externalTransactionId
    );

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const updated = await this.walletTransactionRepository.updateStatus(
      transaction.id,
      TransactionStatus.FAILED
    );

    return updated;
  }

  /**
   * Create a payout transaction (when operator gets paid)
   */
  async createPayoutTransaction(
    userId: string,
    bookingId: string,
    amountCents: number,
    metadata?: Record<string, unknown>
  ) {
    const amountDecimal = (amountCents / 100).toFixed(2);

    const transaction = await this.walletTransactionRepository.create({
      userId,
      bookingId,
      amount: amountDecimal,
      type: TransactionType.PAYOUT,
      status: TransactionStatus.COMPLETED, // Payouts are immediately available
      paymentMethod: 'platform',
      metadata,
    });

    return transaction;
  }

  /**
   * Create a platform fee transaction
   */
  async createPlatformFeeTransaction(
    userId: string,
    bookingId: string,
    amountCents: number,
    metadata?: Record<string, unknown>
  ) {
    const amountDecimal = (amountCents / 100).toFixed(2);

    const transaction = await this.walletTransactionRepository.create({
      userId,
      bookingId,
      amount: amountDecimal,
      type: TransactionType.PLATFORM_FEE,
      status: TransactionStatus.COMPLETED,
      paymentMethod: 'platform',
      metadata,
    });

    return transaction;
  }

  /**
   * Create a refund transaction
   */
  async createRefundTransaction(
    userId: string,
    bookingId: string,
    amountCents: number,
    externalTransactionId?: string,
    metadata?: Record<string, unknown>
  ) {
    const amountDecimal = (amountCents / 100).toFixed(2);

    const transaction = await this.walletTransactionRepository.create({
      userId,
      bookingId,
      amount: amountDecimal,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      paymentMethod: 'stripe',
      externalTransactionId,
      metadata,
    });

    return transaction;
  }

  /**
   * Create a withdrawal request (operator withdraws from wallet)
   */
  async createWithdrawalRequest(
    userId: string,
    amountCents: number,
    metadata?: Record<string, unknown>
  ) {
    // Check if user has sufficient balance
    const balance = await this.walletTransactionRepository.calculateBalance(userId);
    const balanceCents = Math.floor(parseFloat(balance) * 100);

    if (balanceCents < amountCents) {
      throw new BadRequestException('Insufficient balance');
    }

    const amountDecimal = (amountCents / 100).toFixed(2);

    const transaction = await this.walletTransactionRepository.create({
      userId,
      amount: amountDecimal,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING, // Pending until processed
      paymentMethod: 'bank_transfer',
      metadata,
    });

    return transaction;
  }

  /**
   * Complete a withdrawal
   */
  async completeWithdrawal(transactionId: string) {
    const transaction = await this.walletTransactionRepository.findById(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.type !== TransactionType.WITHDRAWAL) {
      throw new BadRequestException('Transaction is not a withdrawal');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not pending');
    }

    const updated = await this.walletTransactionRepository.updateStatus(
      transactionId,
      TransactionStatus.COMPLETED,
      new Date()
    );

    return updated;
  }

  /**
   * Get transactions for a booking
   */
  async getBookingTransactions(bookingId: string) {
    return await this.walletTransactionRepository.findByBookingId(bookingId);
  }
}
