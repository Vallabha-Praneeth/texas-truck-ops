import { Injectable } from '@nestjs/common';
import { db } from '@led-billboard/db';
import { walletTransactions } from '@led-billboard/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { TransactionType, TransactionStatus } from '@led-billboard/shared';

@Injectable()
export class WalletTransactionRepository {
  /**
   * Create a new wallet transaction
   */
  async create(data: {
    userId: string;
    bookingId?: string;
    amount: string;
    type: TransactionType;
    status?: TransactionStatus;
    paymentMethod?: string;
    externalTransactionId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        userId: data.userId,
        bookingId: data.bookingId,
        amount: data.amount,
        type: data.type,
        status: data.status || TransactionStatus.PENDING,
        paymentMethod: data.paymentMethod,
        externalTransactionId: data.externalTransactionId,
        metadata: data.metadata,
      })
      .returning();

    return transaction;
  }

  /**
   * Find transaction by ID
   */
  async findById(id: string) {
    const [transaction] = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.id, id))
      .limit(1);

    return transaction || null;
  }

  /**
   * Find transaction by external transaction ID (e.g., Stripe payment intent)
   */
  async findByExternalId(externalTransactionId: string) {
    const [transaction] = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.externalTransactionId, externalTransactionId))
      .limit(1);

    return transaction || null;
  }

  /**
   * Get user's transactions with pagination and filtering
   */
  async findByUserId(
    userId: string,
    options?: {
      type?: TransactionType;
      status?: TransactionStatus;
      limit?: number;
      offset?: number;
    }
  ) {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    // Build where conditions
    const conditions = [eq(walletTransactions.userId, userId)];

    if (options?.type) {
      conditions.push(eq(walletTransactions.type, options.type));
    }

    if (options?.status) {
      conditions.push(eq(walletTransactions.status, options.status));
    }

    return await db
      .select()
      .from(walletTransactions)
      .where(and(...conditions))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get transactions for a specific booking
   */
  async findByBookingId(bookingId: string) {
    return await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.bookingId, bookingId))
      .orderBy(desc(walletTransactions.createdAt));
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    id: string,
    status: TransactionStatus,
    completedAt?: Date
  ) {
    const [updated] = await db
      .update(walletTransactions)
      .set({
        status,
        completedAt: completedAt || (status === TransactionStatus.COMPLETED ? new Date() : undefined),
      })
      .where(eq(walletTransactions.id, id))
      .returning();

    return updated;
  }

  /**
   * Calculate user's wallet balance
   * Sum of all completed transactions (deposits and payouts are positive, withdrawals and fees are negative)
   */
  async calculateBalance(userId: string): Promise<string> {
    const result = await db
      .select({
        balance: sql<string>`
          COALESCE(
            SUM(
              CASE
                WHEN ${walletTransactions.type} IN ('deposit', 'payout', 'refund')
                THEN ${walletTransactions.amount}::numeric
                WHEN ${walletTransactions.type} IN ('withdrawal', 'platform_fee')
                THEN -${walletTransactions.amount}::numeric
                ELSE 0
              END
            ),
            0
          )
        `.as('balance'),
      })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.userId, userId),
          eq(walletTransactions.status, TransactionStatus.COMPLETED)
        )
      );

    return result[0]?.balance || '0';
  }

  /**
   * Get transaction statistics for a user
   */
  async getStats(userId: string) {
    const result = await db
      .select({
        totalDeposits: sql<string>`COALESCE(SUM(CASE WHEN ${walletTransactions.type} = 'deposit' AND ${walletTransactions.status} = 'completed' THEN ${walletTransactions.amount}::numeric ELSE 0 END), 0)`,
        totalPayouts: sql<string>`COALESCE(SUM(CASE WHEN ${walletTransactions.type} = 'payout' AND ${walletTransactions.status} = 'completed' THEN ${walletTransactions.amount}::numeric ELSE 0 END), 0)`,
        totalWithdrawals: sql<string>`COALESCE(SUM(CASE WHEN ${walletTransactions.type} = 'withdrawal' AND ${walletTransactions.status} = 'completed' THEN ${walletTransactions.amount}::numeric ELSE 0 END), 0)`,
        totalFees: sql<string>`COALESCE(SUM(CASE WHEN ${walletTransactions.type} = 'platform_fee' AND ${walletTransactions.status} = 'completed' THEN ${walletTransactions.amount}::numeric ELSE 0 END), 0)`,
        pendingCount: sql<number>`COUNT(*) FILTER (WHERE ${walletTransactions.status} = 'pending')`,
      })
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId));

    return result[0];
  }
}
