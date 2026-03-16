import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { WalletTransactionRepository } from './wallet-transaction.repository';
import { TransactionType, TransactionStatus } from '@led-billboard/shared';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;
  let repository: jest.Mocked<WalletTransactionRepository>;

  beforeEach(async () => {
    const mockRepository = {
      calculateBalance: jest.fn(),
      getStats: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByExternalId: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      findByBookingId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: WalletTransactionRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    repository = module.get(WalletTransactionRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return user balance and statistics', async () => {
      const userId = 'user-123';
      repository.calculateBalance.mockResolvedValue('100.00');
      repository.getStats.mockResolvedValue({
        totalDeposits: '150.00',
        totalPayouts: '50.00',
        totalWithdrawals: '0.00',
        totalFees: '0.00',
        pendingCount: 2,
      });

      const result = await service.getBalance(userId);

      expect(result).toEqual({
        balance: '100.00',
        totalDeposits: '150.00',
        totalPayouts: '50.00',
        totalWithdrawals: '0.00',
        totalFees: '0.00',
        pendingTransactions: 2,
      });
      expect(repository.calculateBalance).toHaveBeenCalledWith(userId);
      expect(repository.getStats).toHaveBeenCalledWith(userId);
    });
  });

  describe('createDepositTransaction', () => {
    it('should create a pending deposit transaction', async () => {
      const userId = 'user-123';
      const bookingId = 'booking-456';
      const amountCents = 5000; // $50.00
      const externalTxId = 'pi_stripe123';

      const mockTransaction = {
        id: 'tx-789',
        userId,
        bookingId,
        amount: '50.00',
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        paymentMethod: 'stripe',
        externalTransactionId: externalTxId,
        metadata: { test: true },
        createdAt: new Date(),
        completedAt: null,
      };

      repository.create.mockResolvedValue(mockTransaction as any);

      const result = await service.createDepositTransaction(
        userId,
        bookingId,
        amountCents,
        externalTxId,
        { test: true }
      );

      expect(result).toEqual(mockTransaction);
      expect(repository.create).toHaveBeenCalledWith({
        userId,
        bookingId,
        amount: '50.00',
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        paymentMethod: 'stripe',
        externalTransactionId: externalTxId,
        metadata: { test: true },
      });
    });
  });

  describe('completeDeposit', () => {
    it('should complete a pending deposit transaction', async () => {
      const externalTxId = 'pi_stripe123';
      const mockTransaction = {
        id: 'tx-789',
        status: TransactionStatus.PENDING,
      };

      repository.findByExternalId.mockResolvedValue(mockTransaction as any);
      repository.updateStatus.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      } as any);

      const result = await service.completeDeposit(externalTxId);

      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(repository.findByExternalId).toHaveBeenCalledWith(externalTxId);
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'tx-789',
        TransactionStatus.COMPLETED,
        expect.any(Date)
      );
    });

    it('should throw NotFoundException if transaction not found', async () => {
      repository.findByExternalId.mockResolvedValue(null);

      await expect(service.completeDeposit('invalid')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if transaction not pending', async () => {
      repository.findByExternalId.mockResolvedValue({
        id: 'tx-789',
        status: TransactionStatus.COMPLETED,
      } as any);

      await expect(service.completeDeposit('pi_stripe123')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('createWithdrawalRequest', () => {
    it('should create withdrawal if balance is sufficient', async () => {
      const userId = 'user-123';
      const amountCents = 5000;

      repository.calculateBalance.mockResolvedValue('100.00'); // $100 balance
      repository.create.mockResolvedValue({
        id: 'tx-456',
        userId,
        amount: '50.00',
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PENDING,
      } as any);

      const result = await service.createWithdrawalRequest(userId, amountCents);

      expect(result).toBeDefined();
      expect(repository.calculateBalance).toHaveBeenCalledWith(userId);
      expect(repository.create).toHaveBeenCalledWith({
        userId,
        amount: '50.00',
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PENDING,
        paymentMethod: 'bank_transfer',
        metadata: undefined,
      });
    });

    it('should throw BadRequestException if balance is insufficient', async () => {
      const userId = 'user-123';
      const amountCents = 15000;

      repository.calculateBalance.mockResolvedValue('100.00'); // Only $100 balance

      await expect(
        service.createWithdrawalRequest(userId, amountCents)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createPayoutTransaction', () => {
    it('should create a completed payout transaction', async () => {
      const userId = 'operator-123';
      const bookingId = 'booking-456';
      const amountCents = 8500; // $85.00 (after 15% fee)

      repository.create.mockResolvedValue({
        id: 'tx-payout',
        userId,
        bookingId,
        amount: '85.00',
        type: TransactionType.PAYOUT,
        status: TransactionStatus.COMPLETED,
      } as any);

      const result = await service.createPayoutTransaction(
        userId,
        bookingId,
        amountCents
      );

      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(repository.create).toHaveBeenCalledWith({
        userId,
        bookingId,
        amount: '85.00',
        type: TransactionType.PAYOUT,
        status: TransactionStatus.COMPLETED,
        paymentMethod: 'platform',
        metadata: undefined,
      });
    });
  });

  describe('getTransactions', () => {
    it('should return filtered transactions', async () => {
      const userId = 'user-123';
      const filters = {
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        limit: 10,
        offset: 0,
      };

      const mockTransactions = [
        { id: 'tx-1', type: TransactionType.DEPOSIT },
        { id: 'tx-2', type: TransactionType.DEPOSIT },
      ];

      repository.findByUserId.mockResolvedValue(mockTransactions as any);

      const result = await service.getTransactions(userId, filters);

      expect(result).toEqual(mockTransactions);
      expect(repository.findByUserId).toHaveBeenCalledWith(userId, filters);
    });
  });
});
