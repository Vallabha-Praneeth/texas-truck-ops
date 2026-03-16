import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';

/**
 * NotificationsModule
 *
 * Provides notification services for the application:
 * - SMS: Twilio integration for OTP delivery
 * - Email: Placeholder for future email notifications
 * - Push: Placeholder for future mobile push notifications
 */
@Module({
    imports: [ConfigModule],
    providers: [SmsService, EmailService, PushService],
    exports: [SmsService, EmailService, PushService],
})
export class NotificationsModule {}
