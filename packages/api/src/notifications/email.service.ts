import { Injectable } from '@nestjs/common';

/**
 * Email Service - Placeholder for future email notifications
 * TODO: Implement with SendGrid, AWS SES, or similar service
 */
@Injectable()
export class EmailService {
    /**
     * Send OTP via email
     * @param email - Recipient email address
     * @param code - OTP code to send
     */
    async sendOtp(email: string, code: string): Promise<void> {
        console.log(`[EMAIL SERVICE - NOT IMPLEMENTED] OTP for ${email}: ${code}`);
        // TODO: Implement email sending
        // - Configure email provider (SendGrid, AWS SES, etc.)
        // - Create email template for OTP
        // - Send email and handle errors
        // - Log delivery status
    }

    /**
     * Send welcome email
     * @param email - Recipient email address
     * @param displayName - User's display name
     */
    async sendWelcomeEmail(email: string, displayName: string): Promise<void> {
        console.log(`[EMAIL SERVICE - NOT IMPLEMENTED] Welcome email for ${email} (${displayName})`);
        // TODO: Implement welcome email
    }

    /**
     * Send booking confirmation email
     * @param email - Recipient email address
     * @param bookingDetails - Booking information
     */
    async sendBookingConfirmation(email: string, bookingDetails: any): Promise<void> {
        console.log(`[EMAIL SERVICE - NOT IMPLEMENTED] Booking confirmation for ${email}`);
        // TODO: Implement booking confirmation email
    }
}
