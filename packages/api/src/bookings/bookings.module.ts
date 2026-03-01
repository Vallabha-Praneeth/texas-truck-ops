import { Module } from '@nestjs/common';
import { BookingService } from './bookings.service';
import { BookingsService } from './bookings-query.service';
import { BookingsController } from './bookings.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
    imports: [RealtimeModule],
    controllers: [BookingsController],
    providers: [BookingService, BookingsService],
    exports: [BookingService, BookingsService],
})
export class BookingsModule { }
