import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Request,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DepositDto, depositSchema } from '@led-billboard/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly stripeService: StripeService) {}

  /**
   * POST /api/payments/deposit
   * Create a Stripe checkout session for deposit payment
   */
  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  async createDeposit(
    @Request() req,
    @Body(new ZodValidationPipe(depositSchema)) body: DepositDto
  ) {
    const userId = req.user.id;

    const session = await this.stripeService.createCheckoutSession(
      userId,
      body.bookingId,
      body.amountCents,
      {
        bookingId: body.bookingId,
        userId,
        type: 'deposit',
      },
      {
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
      }
    );

    return {
      sessionId: session.sessionId,
      url: session.url,
    };
  }

  /**
   * POST /api/payments/stripe/webhook
   * Handle Stripe webhook events
   *
   * This endpoint receives events from Stripe when payments succeed/fail
   * It must be accessible without authentication and handle raw body
   */
  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Request() req: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Get raw body (required for signature verification)
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing request body');
    }

    try {
      // Verify webhook signature
      const event = this.stripeService.verifyWebhookSignature(rawBody, signature);

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.stripeService.handlePaymentSuccess(event.data.object as any);
          break;

        case 'payment_intent.payment_failed':
          await this.stripeService.handlePaymentFailure(event.data.object as any);
          break;

        case 'checkout.session.completed': {
          // Handle successful checkout session
          const session = event.data.object as any;
          if (session.payment_intent) {
            const paymentIntent = await this.stripeService.getPaymentIntent(
              session.payment_intent as string
            );
            await this.stripeService.handlePaymentSuccess(paymentIntent);
          }
          break;
        }

        case 'checkout.session.expired':
          // Handle expired checkout session (optional)
          console.log('Checkout session expired:', event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Webhook error: ${message}`);
    }
  }
}
