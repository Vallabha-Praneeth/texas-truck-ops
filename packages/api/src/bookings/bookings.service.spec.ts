import { BookingService, BookingStatus } from './bookings.service';
import { db } from '@led-billboard/db';

jest.mock('@led-billboard/db', () => ({
    db: {
        select: jest.fn(),
        update: jest.fn(),
    },
    bookings: {
        id: Symbol('bookings.id'),
    },
    availabilitySlots: {
        truckId: Symbol('availability_slots.truck_id'),
    },
    offers: {},
    users: {
        id: Symbol('users.id'),
        primaryRole: Symbol('users.primary_role'),
    },
}));

describe('BookingService', () => {
    let service: BookingService;

    beforeEach(() => {
        service = new BookingService();
        jest.clearAllMocks();
    });

    describe('checkSlotOverlap', () => {
        it('returns true when the incoming window overlaps an existing slot', async () => {
            const rows = [
                {
                    id: 'slot-1',
                    startAt: new Date('2026-02-10T10:00:00Z'),
                    endAt: new Date('2026-02-10T14:00:00Z'),
                },
            ];

            const where = jest.fn().mockResolvedValue(rows);
            const from = jest.fn().mockReturnValue({ where });
            (db.select as unknown as jest.Mock).mockReturnValue({ from });

            const result = await service.checkSlotOverlap(
                'truck-1',
                new Date('2026-02-10T12:00:00Z'),
                new Date('2026-02-10T16:00:00Z')
            );

            expect(result).toBe(true);
            expect(where).toHaveBeenCalled();
        });

        it('returns false when the incoming window does not overlap', async () => {
            const rows = [
                {
                    id: 'slot-1',
                    startAt: new Date('2026-02-10T10:00:00Z'),
                    endAt: new Date('2026-02-10T14:00:00Z'),
                },
            ];

            const where = jest.fn().mockResolvedValue(rows);
            const from = jest.fn().mockReturnValue({ where });
            (db.select as unknown as jest.Mock).mockReturnValue({ from });

            const result = await service.checkSlotOverlap(
                'truck-1',
                new Date('2026-02-10T14:00:00Z'),
                new Date('2026-02-10T16:00:00Z')
            );

            expect(result).toBe(false);
        });

        it('ignores overlap on the excluded slot id', async () => {
            const rows = [
                {
                    id: 'slot-1',
                    startAt: new Date('2026-02-10T10:00:00Z'),
                    endAt: new Date('2026-02-10T14:00:00Z'),
                },
            ];

            const where = jest.fn().mockResolvedValue(rows);
            const from = jest.fn().mockReturnValue({ where });
            (db.select as unknown as jest.Mock).mockReturnValue({ from });

            const result = await service.checkSlotOverlap(
                'truck-1',
                new Date('2026-02-10T12:00:00Z'),
                new Date('2026-02-10T13:00:00Z'),
                'slot-1'
            );

            expect(result).toBe(false);
        });
    });

    describe('validateTransition', () => {
        it('allows valid state transitions', () => {
            expect(() =>
                service['validateTransition'](
                    BookingStatus.PENDING_DEPOSIT,
                    BookingStatus.CONFIRMED
                )
            ).not.toThrow();

            expect(() =>
                service['validateTransition'](
                    BookingStatus.CONFIRMED,
                    BookingStatus.RUNNING
                )
            ).not.toThrow();
        });

        it('rejects invalid state transitions', () => {
            expect(() =>
                service['validateTransition'](
                    BookingStatus.PENDING_DEPOSIT,
                    BookingStatus.COMPLETED
                )
            ).toThrow(/Invalid transition/);

            expect(() =>
                service['validateTransition'](
                    BookingStatus.COMPLETED,
                    BookingStatus.RUNNING
                )
            ).toThrow(/Invalid transition/);
        });
    });

    describe('assignDriverToBooking', () => {
        it('assigns a driver user to booking', async () => {
            const booking = {
                id: 'booking-1',
                brokerUserId: 'broker-1',
                operatorOrgId: 'org-1',
                driverUserId: null,
                updatedAt: new Date('2026-02-10T10:00:00Z'),
            };
            const driver = {
                id: 'driver-1',
                primaryRole: 'driver',
            };
            const updated = {
                ...booking,
                driverUserId: 'driver-1',
                updatedAt: new Date('2026-02-10T11:00:00Z'),
            };

            const bookingLimit = jest.fn().mockResolvedValue([booking]);
            const bookingWhere = jest.fn().mockReturnValue({ limit: bookingLimit });
            const bookingFrom = jest.fn().mockReturnValue({ where: bookingWhere });

            const driverLimit = jest.fn().mockResolvedValue([driver]);
            const driverWhere = jest.fn().mockReturnValue({ limit: driverLimit });
            const driverFrom = jest.fn().mockReturnValue({ where: driverWhere });

            (db.select as unknown as jest.Mock)
                .mockReturnValueOnce({ from: bookingFrom })
                .mockReturnValueOnce({ from: driverFrom });

            const returning = jest.fn().mockResolvedValue([updated]);
            const where = jest.fn().mockReturnValue({ returning });
            const set = jest.fn().mockReturnValue({ where });
            (db.update as unknown as jest.Mock).mockReturnValue({ set });

            const result = await service.assignDriverToBooking(
                'booking-1',
                'driver-1'
            );

            expect(result.driverUserId).toBe('driver-1');
            expect(set).toHaveBeenCalledWith(
                expect.objectContaining({
                    driverUserId: 'driver-1',
                    updatedAt: expect.any(Date),
                })
            );
        });

        it('rejects assigning non-driver user', async () => {
            const booking = {
                id: 'booking-1',
                brokerUserId: 'broker-1',
                operatorOrgId: 'org-1',
                driverUserId: null,
                updatedAt: new Date('2026-02-10T10:00:00Z'),
            };
            const nonDriver = {
                id: 'user-1',
                primaryRole: 'operator',
            };

            const bookingLimit = jest.fn().mockResolvedValue([booking]);
            const bookingWhere = jest.fn().mockReturnValue({ limit: bookingLimit });
            const bookingFrom = jest.fn().mockReturnValue({ where: bookingWhere });

            const driverLimit = jest.fn().mockResolvedValue([nonDriver]);
            const driverWhere = jest.fn().mockReturnValue({ limit: driverLimit });
            const driverFrom = jest.fn().mockReturnValue({ where: driverWhere });

            (db.select as unknown as jest.Mock)
                .mockReturnValueOnce({ from: bookingFrom })
                .mockReturnValueOnce({ from: driverFrom });

            await expect(
                service.assignDriverToBooking('booking-1', 'user-1')
            ).rejects.toThrow('Assigned user must have driver role');
        });
    });
});
