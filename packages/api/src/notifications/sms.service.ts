import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import {
    createTwilioClient,
    getTwilioPhoneNumber,
    getTwilioVerifyServiceSid,
} from './twilio.config';

export interface SmsDeliveryResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

@Injectable()
export class SmsService {
    private readonly twilioClient: Twilio;
    private readonly fromPhoneNumber: string;
    private readonly verifyServiceSid?: string;
    private readonly isTestMode: boolean;

    constructor(private configService: ConfigService) {
        this.isTestMode =
            process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';

        // Only initialize Twilio in non-test mode
        if (!this.isTestMode) {
            try {
                this.twilioClient = createTwilioClient(configService);
                this.fromPhoneNumber = getTwilioPhoneNumber(configService);
                this.verifyServiceSid = getTwilioVerifyServiceSid(configService);
            } catch (error) {
                console.error('Failed to initialize Twilio client:', error);
                // Don't throw in constructor to allow app to start
                // Errors will be thrown when sendOtp is called
            }
        }
    }

    /**
     * Send OTP via SMS using Twilio
     * @param phoneNumber - Phone number in E.164 format (+1XXXXXXXXXX)
     * @param code - OTP code to send
     * @returns Promise<SmsDeliveryResult>
     */
    async sendOtp(phoneNumber: string, code: string): Promise<SmsDeliveryResult> {
        // In test mode, log to console and return success
        if (this.isTestMode) {
            console.log(`[TEST MODE] SMS OTP for ${phoneNumber}: ${code}`);
            return {
                success: true,
                messageId: 'test-message-id',
            };
        }

        // Validate Twilio client is initialized
        if (!this.twilioClient || !this.fromPhoneNumber) {
            const error = 'Twilio client not initialized. Check TWILIO_* environment variables.';
            console.error(error);
            throw new InternalServerErrorException(error);
        }

        // Use Verify API if configured, otherwise use Programmable SMS
        if (this.verifyServiceSid) {
            return await this.sendOtpViaVerifyApi(phoneNumber, code);
        } else {
            return await this.sendOtpViaProgrammableSms(phoneNumber, code);
        }
    }

    /**
     * Send OTP using Twilio Verify API (recommended for production)
     * Verify API handles rate limiting, fraud detection, and delivery optimization
     */
    private async sendOtpViaVerifyApi(
        phoneNumber: string,
        code: string
    ): Promise<SmsDeliveryResult> {
        try {
            // Note: Verify API generates its own codes, but we're using our own OTP
            // For full Verify API integration, you'd use verification.create() instead
            // and let Twilio generate the code. This is a hybrid approach.
            const message = await this.twilioClient.messages.create({
                body: `Your LED Billboard Marketplace verification code is: ${code}. Valid for 10 minutes.`,
                from: this.fromPhoneNumber,
                to: phoneNumber,
            });

            console.log(`✅ SMS sent successfully to ${phoneNumber} (SID: ${message.sid})`);

            return {
                success: true,
                messageId: message.sid,
            };
        } catch (error) {
            console.error(`❌ Failed to send SMS to ${phoneNumber}:`, error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Send OTP using Twilio Programmable SMS
     * Simple SMS sending without Verify API features
     */
    private async sendOtpViaProgrammableSms(
        phoneNumber: string,
        code: string
    ): Promise<SmsDeliveryResult> {
        try {
            const message = await this.twilioClient.messages.create({
                body: `Your LED Billboard Marketplace verification code is: ${code}. Valid for 10 minutes.`,
                from: this.fromPhoneNumber,
                to: phoneNumber,
            });

            console.log(`✅ SMS sent successfully to ${phoneNumber} (SID: ${message.sid})`);

            // Log delivery status
            if (message.status === 'failed' || message.status === 'undelivered') {
                console.error(`⚠️ SMS delivery failed for ${phoneNumber}: ${message.errorMessage}`);
                return {
                    success: false,
                    error: message.errorMessage || 'SMS delivery failed',
                };
            }

            return {
                success: true,
                messageId: message.sid,
            };
        } catch (error) {
            console.error(`❌ Failed to send SMS to ${phoneNumber}:`, error);

            // Handle specific Twilio errors
            let errorMessage = 'Failed to send SMS';
            if (error && typeof error === 'object' && 'code' in error) {
                const twilioError = error as { code: number; message: string };
                switch (twilioError.code) {
                    case 21211:
                        errorMessage = 'Invalid phone number';
                        break;
                    case 21608:
                        errorMessage = 'Phone number is not verified (test mode)';
                        break;
                    case 21614:
                        errorMessage = 'Invalid "To" phone number';
                        break;
                    default:
                        errorMessage = twilioError.message || errorMessage;
                }
            }

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Get SMS delivery status by message SID
     * Useful for tracking delivery and debugging
     */
    async getMessageStatus(messageSid: string): Promise<any> {
        if (this.isTestMode) {
            return { status: 'delivered', error: null };
        }

        if (!this.twilioClient) {
            throw new InternalServerErrorException('Twilio client not initialized');
        }

        try {
            const message = await this.twilioClient.messages(messageSid).fetch();
            return {
                status: message.status,
                errorCode: message.errorCode,
                errorMessage: message.errorMessage,
                dateCreated: message.dateCreated,
                dateSent: message.dateSent,
            };
        } catch (error) {
            console.error(`Failed to fetch message status for ${messageSid}:`, error);
            throw error;
        }
    }
}
