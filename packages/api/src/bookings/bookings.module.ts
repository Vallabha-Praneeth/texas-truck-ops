import { Module, forwardRef } from '@nestjs/common';
import { BookingService } from './bookings.service';
import { BookingsService } from './bookings-query.service';
import { BookingsController } from './bookings.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [RealtimeModule, forwardRef(() => WalletModule)],
    controllers: [BookingsController],
    providers: [BookingService, BookingsService],
    exports: [BookingService, BookingsService],
})
export class BookingsModule { }
