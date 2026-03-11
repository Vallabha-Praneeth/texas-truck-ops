import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { OffersModule } from './offers/offers.module';
import { RequestsModule } from './requests/requests.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TrucksModule } from './trucks/trucks.module';
import { SlotsModule } from './slots/slots.module';
import { RealtimeModule } from './realtime/realtime.module';
import { DriversModule } from './drivers/drivers.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        RedisModule,
        UsersModule,
        AuthModule,
        BookingsModule,
        OffersModule,
        RequestsModule,
        OrganizationsModule,
        TrucksModule,
        SlotsModule,
        RealtimeModule,
        DriversModule,
        // Additional modules for future:
        // - MessagesModule
        // - ProofsModule
        // - WalletModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
