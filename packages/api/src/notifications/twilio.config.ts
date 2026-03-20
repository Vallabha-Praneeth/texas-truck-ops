import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

/**
 * Create and configure Twilio client
 * Supports both Programmable SMS and Verify API
 */
export function createTwilioClient(configService: ConfigService): Twilio {
    const accountSid = configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
        throw new Error(
            'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.'
        );
    }

    return new Twilio(accountSid, authToken);
}

/**
 * Get Twilio phone number for sending SMS
 */
export function getTwilioPhoneNumber(configService: ConfigService): string {
    const phoneNumber = configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!phoneNumber) {
        throw new Error(
            'Twilio phone number not configured. Set TWILIO_PHONE_NUMBER environment variable.'
        );
    }

    return phoneNumber;
}

/**
 * Get Twilio Verify Service SID (optional, for Verify API)
 */
export function getTwilioVerifyServiceSid(configService: ConfigService): string | undefined {
    return configService.get<string>('TWILIO_VERIFY_SERVICE_SID');
}
