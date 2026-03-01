"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@led-billboard/shared");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const zod_validation_1 = require("../common/zod-validation");
const bookings_query_service_1 = require("./bookings-query.service");
const bookings_service_1 = require("./bookings.service");
const zod_1 = require("zod");
const assignDriverSchema = zod_1.z.object({
    driverUserId: zod_1.z.string().uuid(),
});
let BookingsController = class BookingsController {
    constructor(bookingsQueryService, bookingService) {
        this.bookingsQueryService = bookingsQueryService;
        this.bookingService = bookingService;
    }
    async listBookings(req) {
        return this.bookingsQueryService.listBookings(req.user.id, req.user.primaryRole);
    }
    async getBooking(id, req) {
        return this.bookingsQueryService.getBookingById(id, req.user.id, req.user.primaryRole);
    }
    async updateBookingStatus(id, body, req) {
        const dto = (0, zod_validation_1.parseWithSchema)(shared_1.updateBookingStatusSchema, body, 'Invalid booking status update payload');
        const booking = await this.bookingsQueryService.getBookingById(id, req.user.id, req.user.primaryRole);
        const canTransition = this.isTransitionAllowedForRole(req.user.primaryRole, booking.status, dto.status);
        if (!canTransition) {
            throw new common_1.ForbiddenException(`Role ${req.user.primaryRole} cannot move booking from ${booking.status} to ${dto.status}`);
        }
        try {
            await this.bookingService.transitionBookingStatus(id, this.toBookingStatus(dto.status), this.createTransitionMetadata(dto.status, req.user.primaryRole, dto.cancellationReason));
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to transition booking status';
            if (message.toLowerCase().includes('not found')) {
                throw new common_1.NotFoundException(message);
            }
            throw new common_1.BadRequestException(message);
        }
        return this.bookingsQueryService.getBookingById(id, req.user.id, req.user.primaryRole);
    }
    async assignDriver(id, body, req) {
        if (req.user.primaryRole !== 'broker' &&
            req.user.primaryRole !== 'operator') {
            throw new common_1.ForbiddenException('Only brokers or operators can assign drivers');
        }
        const dto = (0, zod_validation_1.parseWithSchema)(assignDriverSchema, body, 'Invalid assign driver payload');
        await this.bookingsQueryService.getBookingById(id, req.user.id, req.user.primaryRole);
        try {
            await this.bookingService.assignDriverToBooking(id, dto.driverUserId);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to assign driver';
            if (message.toLowerCase().includes('not found')) {
                throw new common_1.NotFoundException(message);
            }
            throw new common_1.BadRequestException(message);
        }
        return this.bookingsQueryService.getBookingById(id, req.user.id, req.user.primaryRole);
    }
    toBookingStatus(status) {
        const statusMap = {
            pending_deposit: bookings_service_1.BookingStatus.PENDING_DEPOSIT,
            confirmed: bookings_service_1.BookingStatus.CONFIRMED,
            running: bookings_service_1.BookingStatus.RUNNING,
            awaiting_review: bookings_service_1.BookingStatus.AWAITING_REVIEW,
            completed: bookings_service_1.BookingStatus.COMPLETED,
            cancelled: bookings_service_1.BookingStatus.CANCELLED,
            disputed: bookings_service_1.BookingStatus.DISPUTED,
        };
        return statusMap[status];
    }
    createTransitionMetadata(status, role, cancellationReason) {
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
                    cancellationReason: cancellationReason ?? `Cancelled by ${role}`,
                };
            default:
                return undefined;
        }
    }
    isTransitionAllowedForRole(role, currentStatus, nextStatus) {
        if (role === 'driver') {
            return ((currentStatus === 'confirmed' && nextStatus === 'running') ||
                (currentStatus === 'running' &&
                    nextStatus === 'awaiting_review'));
        }
        if (role === 'broker') {
            return ((currentStatus === 'pending_deposit' &&
                nextStatus === 'confirmed') ||
                (currentStatus === 'awaiting_review' &&
                    nextStatus === 'completed') ||
                (['pending_deposit', 'confirmed', 'running', 'awaiting_review'].includes(currentStatus) &&
                    (nextStatus === 'cancelled' || nextStatus === 'disputed')));
        }
        if (role === 'operator') {
            return (['pending_deposit', 'confirmed', 'running', 'awaiting_review'].includes(currentStatus) &&
                (nextStatus === 'cancelled' || nextStatus === 'disputed'));
        }
        return false;
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "listBookings", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getBooking", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "updateBookingStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign-driver'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "assignDriver", null);
exports.BookingsController = BookingsController = __decorate([
    (0, common_1.Controller)('bookings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [bookings_query_service_1.BookingsService,
        bookings_service_1.BookingService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map