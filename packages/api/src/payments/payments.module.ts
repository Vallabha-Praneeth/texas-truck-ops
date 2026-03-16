import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [ConfigModule, WalletModule],
  controllers: [PaymentsController],
  providers: [StripeService],
  exports: [StripeService],
})
export class PaymentsModule {}
