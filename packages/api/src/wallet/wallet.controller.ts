import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetTransactionsDto, getTransactionsSchema } from '@led-billboard/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * GET /api/wallet/balance
   * Get current user's wallet balance
   */
  @Get('balance')
  async getBalance(@Request() req) {
    const userId = req.user.userId;
    return await this.walletService.getBalance(userId);
  }

  /**
   * GET /api/wallet/transactions
   * Get current user's transaction history with pagination and filtering
   */
  @Get('transactions')
  async getTransactions(
    @Request() req,
    @Query(new ZodValidationPipe(getTransactionsSchema)) query: GetTransactionsDto
  ) {
    const userId = req.user.userId;
    return await this.walletService.getTransactions(userId, query);
  }

  /**
   * GET /api/wallet/transactions/:id
   * Get a specific transaction by ID
   */
  @Get('transactions/:id')
  async getTransaction(@Param('id') id: string) {
    return await this.walletService.getTransactionById(id);
  }

  /**
   * GET /api/wallet/bookings/:bookingId/transactions
   * Get all transactions for a specific booking
   */
  @Get('bookings/:bookingId/transactions')
  async getBookingTransactions(@Param('bookingId') bookingId: string) {
    return await this.walletService.getBookingTransactions(bookingId);
  }
}
