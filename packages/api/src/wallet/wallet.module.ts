import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletTransactionRepository } from './wallet-transaction.repository';

@Module({
  controllers: [WalletController],
  providers: [WalletService, WalletTransactionRepository],
  exports: [WalletService],
})
export class WalletModule {}
