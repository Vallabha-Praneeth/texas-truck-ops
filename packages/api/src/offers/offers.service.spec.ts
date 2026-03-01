import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { db } from '@led-billboard/db';
import { OffersService } from './offers.service';

jest.mock('@led-billboard/db', () => ({
    db: {
        select: jest.fn(),
        update: jest.fn(),
    },
    offers: {
        id: Symbol('offers.id'),
    },
    availabilitySlots: {
        id: Symbol('availability_slots.id'),
        isBooked: Symbol('availability_slots.is_booked'),
    },
    requests: {
        id: Symbol('requests.id'),
    },
}));

type OfferRow = {
    id: string;
    slotId: string | null;
    requestId: string | null;
    createdBy: string;
    amountCents: number;
    currency: string;
    terms: Record<string, unknown> | null;
    status: string;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

const baseOffer = (): OfferRow => ({
    id: 'offer-1',
    slotId: null,
    requestId: null,
    createdBy: 'broker-owner',
    amountCents: 10000,
    currency: 'USD',
    terms: null,
    status: 'pending',
    expiresAt: null,
    createdAt: new Date('2026-02-22T00:00:00.000Z'),
    updatedAt: new Date('2026-02-22T00:00:00.000Z'),
});

const mockSelectOne = (offer: OfferRow | null) => {
    const limit = jest
        .fn()
        .mockResolvedValue(offer ? [offer] : []);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });

    (db.select as unknown as jest.Mock).mockReturnValue({ from });
};

describe('OffersService', () => {
    let service: OffersService;
    let bookingServiceMock: { acceptOffer: jest.Mock };

    beforeEach(() => {
        bookingServiceMock = {
            acceptOffer: jest.fn().mockResolvedValue({ id: 'booking-1' }),
        };
        service = new OffersService(bookingServiceMock as any);
        jest.clearAllMocks();
    });

    it('denies broker access to another broker offer', async () => {
        mockSelectOne(baseOffer());

        await expect(
            service.getOffer('offer-1', 'broker-other', 'broker')
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('denies broker update on another broker offer', async () => {
        mockSelectOne(baseOffer());

        await expect(
            service.updateOffer(
                'offer-1',
                { amountCents: 12000 },
                'broker-other',
                'broker'
            )
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('denies broker from accepting/rejecting offers', async () => {
        mockSelectOne(baseOffer());

        await expect(
            service.updateOffer(
                'offer-1',
                { status: 'accepted' },
                'broker-owner',
                'broker'
            )
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('denies operator from editing amount/terms', async () => {
        mockSelectOne(baseOffer());

        await expect(
            service.updateOffer(
                'offer-1',
                { amountCents: 13000 },
                'operator-1',
                'operator'
            )
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows operator to accept offer status', async () => {
        const existing = baseOffer();
        const updated = {
            ...existing,
            status: 'accepted',
            updatedAt: new Date('2026-02-22T01:00:00.000Z'),
        };

        const firstLimit = jest.fn().mockResolvedValue([existing]);
        const firstWhere = jest.fn().mockReturnValue({ limit: firstLimit });
        const firstFrom = jest.fn().mockReturnValue({ where: firstWhere });

        const secondLimit = jest.fn().mockResolvedValue([updated]);
        const secondWhere = jest.fn().mockReturnValue({ limit: secondLimit });
        const secondFrom = jest.fn().mockReturnValue({ where: secondWhere });

        (db.select as unknown as jest.Mock)
            .mockReturnValueOnce({ from: firstFrom })
            .mockReturnValueOnce({ from: secondFrom });

        const result = await service.updateOffer(
            'offer-1',
            { status: 'accepted' },
            'operator-1',
            'operator'
        );

        expect(result.status).toBe('accepted');
        expect(bookingServiceMock.acceptOffer).toHaveBeenCalledWith(
            'offer-1',
            'operator-1'
        );
    });

    it('rejects updates when no allowed fields are provided', async () => {
        mockSelectOne(baseOffer());

        await expect(
            service.updateOffer('offer-1', {}, 'broker-owner', 'broker')
        ).rejects.toBeInstanceOf(BadRequestException);
    });
});
