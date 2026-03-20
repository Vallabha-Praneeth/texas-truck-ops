import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly walletService: WalletService
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-02-25.clover',
    });
  }

  /**
   * Create a Stripe Checkout Session for deposit payment
   */
  async createCheckoutSession(
    userId: string,
    bookingId: string,
    amountCents: number,
    metadata: {
      bookingId: string;
      userId: string;
      type: string;
    },
    options?: {
      successUrl?: string;
      cancelUrl?: string;
    }
  ) {
    // Default URLs - in production these should be environment variables
    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const successUrl = options?.successUrl || `${baseUrl}/bookings/${bookingId}?payment=success`;
    const cancelUrl = options?.cancelUrl || `${baseUrl}/bookings/${bookingId}?payment=cancelled`;

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Billboard Booking Deposit',
                description: `Deposit payment for booking ${bookingId}`,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        payment_intent_data: {
          metadata,
        },
      });

      // Create pending transaction in wallet
      await this.walletService.createDepositTransaction(
        userId,
        bookingId,
        amountCents,
        session.payment_intent as string,
        {
          sessionId: session.id,
          ...metadata,
        }
      );

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create checkout session: ${message}`);
    }
  }

  /**
   * Create a Payment Intent (for direct card payments)
   */
  async createPaymentIntent(
    userId: string,
    bookingId: string,
    amountCents: number,
    metadata: Record<string, string>
  ) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        metadata: {
          userId,
          bookingId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create pending transaction in wallet
      await this.walletService.createDepositTransaction(
        userId,
        bookingId,
        amountCents,
        paymentIntent.id,
        metadata
      );

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create payment intent: ${message}`);
    }
  }

  /**
   * Process refund for a payment
   */
  async createRefund(
    paymentIntentId: string,
    amountCents?: number,
    reason?: string
  ) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amountCents, // If undefined, refunds full amount
        reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
      });

      return refund;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create refund: ${message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Webhook signature verification failed: ${message}`);
    }
  }

  /**
   * Handle successful payment webhook
   */
  async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const paymentIntentId = paymentIntent.id;

    try {
      // Mark deposit transaction as completed
      await this.walletService.completeDeposit(paymentIntentId);

      return { success: true };
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment webhook
   */
  async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const paymentIntentId = paymentIntent.id;

    try {
      // Mark deposit transaction as failed
      await this.walletService.failDeposit(paymentIntentId);

      return { success: true };
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentIntent(paymentIntentId: string) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to retrieve payment intent: ${message}`);
    }
  }

  /**
   * Get checkout session details
   */
  async getCheckoutSession(sessionId: string) {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to retrieve checkout session: ${message}`);
    }
  }
}
