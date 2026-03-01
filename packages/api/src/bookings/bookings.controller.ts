import {
    BadRequestException,
    Body,
    Controller,
    ForbiddenException,
    Get,
    NotFoundException,
    Param,
    Patch,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    UpdateBookingStatusDto,
    updateBookingStatusSchema,
} from '@led-billboard/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { parseWithSchema } from '../common/zod-validation';
import { BookingsService } from './bookings-query.service';
import { BookingService, BookingStatus } from './bookings.service';
import { z } from 'zod';

const assignDriverSchema = z.object({
    driverUserId: z.string().uuid(),
});

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
    constructor(
        private readonly bookingsQueryService: BookingsService,
        private readonly bookingService: BookingService
    ) {}

    /**
     * GET /api/bookings
     * List bookings visible to the current authenticated user
     */
    @Get()
    async listBookings(@Request() req) {
        return this.bookingsQueryService.listBookings(
            req.user.id,
            req.user.primaryRole
        );
    }

    /**
     * GET /api/bookings/:id
     * Get booking details by ID
     */
    @Get(':id')
    async getBooking(@Param('id') id: string, @Request() req) {
        return this.bookingsQueryService.getBookingById(
            id,
            req.user.id,
            req.user.primaryRole
        );
    }

    /**
     * PATCH /api/bookings/:id/status
     * Transition booking status with role-specific authorization.
     */
    @Patch(':id/status')
    async updateBookingStatus(
        @Param('id') id: string,
        @Body() body: unknown,
        @Request() req
    ) {
        const dto: UpdateBookingStatusDto = parseWithSchema(
            updateBookingStatusSchema,
            body,
            'Invalid booking status update payload'
        );

        const booking = await this.bookingsQueryService.getBookingById(
            id,
            req.user.id,
            req.user.primaryRole
        );

        const canTransition = this.isTransitionAllowedForRole(
            req.user.primaryRole,
            booking.status,
            dto.status
        );

        if (!canTransition) {
            throw new ForbiddenException(
                `Role ${req.user.primaryRole} cannot move booking from ${booking.status} to ${dto.status}`
            );
        }

        try {
            await this.bookingService.transitionBookingStatus(
                id,
                this.toBookingStatus(dto.status),
                this.createTransitionMetadata(
                    dto.status,
                    req.user.primaryRole,
                    dto.cancellationReason
                )
            );
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to transition booking status';

            if (message.toLowerCase().includes('not found')) {
                throw new NotFoundException(message);
            }

            throw new BadRequestException(message);
        }

        return this.bookingsQueryService.getBookingById(
            id,
            req.user.id,
            req.user.primaryRole
        );
    }

    /**
     * PATCH /api/bookings/:id/assign-driver
     * Assign a driver to a booking.
     */
    @Patch(':id/assign-driver')
    async assignDriver(
        @Param('id') id: string,
        @Body() body: unknown,
        @Request() req
    ) {
        if (
            req.user.primaryRole !== 'broker' &&
            req.user.primaryRole !== 'operator'
        ) {
            throw new ForbiddenException(
                'Only brokers or operators can assign drivers'
            );
        }

        const dto = parseWithSchema(
            assignDriverSchema,
            body,
            'Invalid assign driver payload'
        );

        await this.bookingsQueryService.getBookingById(
            id,
            req.user.id,
            req.user.primaryRole
        );

        try {
            await this.bookingService.assignDriverToBooking(
                id,
                dto.driverUserId
            );
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to assign driver';

            if (message.toLowerCase().includes('not found')) {
                throw new NotFoundException(message);
            }

            throw new BadRequestException(message);
        }

        return this.bookingsQueryService.getBookingById(
            id,
            req.user.id,
            req.user.primaryRole
        );
    }

    private toBookingStatus(status: UpdateBookingStatusDto['status']): BookingStatus {
        const statusMap: Record<UpdateBookingStatusDto['status'], BookingStatus> = {
            pending_deposit: BookingStatus.PENDING_DEPOSIT,
            confirmed: BookingStatus.CONFIRMED,
            running: BookingStatus.RUNNING,
            awaiting_review: BookingStatus.AWAITING_REVIEW,
            completed: BookingStatus.COMPLETED,
            cancelled: BookingStatus.CANCELLED,
            disputed: BookingStatus.DISPUTED,
        };

        return statusMap[status];
    }

    private createTransitionMetadata(
        status: UpdateBookingStatusDto['status'],
        role: string,
        cancellationReason?: string
    ) {
        const now = new Date();

        switch (status) {
            case 'confirmed':
                return { depositPaidAt: now };
            case 'running':
                return { startedAt: now };
            case 'completed':
                return { completedAt: now };
            case 'cancelled':
                return {
                    cancelledAt: now,
                    cancellationReason:
                        cancellationReason ?? `Cancelled by ${role}`,
                };
            default:
                return undefined;
        }
    }

    private isTransitionAllowedForRole(
        role: string,
        currentStatus: string,
        nextStatus: UpdateBookingStatusDto['status']
    ): boolean {
        if (role === 'driver') {
            return (
                (currentStatus === 'confirmed' && nextStatus === 'running') ||
                (currentStatus === 'running' &&
                    nextStatus === 'awaiting_review')
            );
        }

        if (role === 'broker') {
            return (
                (currentStatus === 'pending_deposit' &&
                    nextStatus === 'confirmed') ||
                (currentStatus === 'awaiting_review' &&
                    nextStatus === 'completed') ||
                (['pending_deposit', 'confirmed', 'running', 'awaiting_review'].includes(
                    currentStatus
                ) &&
                    (nextStatus === 'cancelled' || nextStatus === 'disputed'))
            );
        }

        if (role === 'operator') {
            return (
                ['pending_deposit', 'confirmed', 'running', 'awaiting_review'].includes(
                    currentStatus
                ) &&
                (nextStatus === 'cancelled' || nextStatus === 'disputed')
            );
        }

        return false;
    }
}
