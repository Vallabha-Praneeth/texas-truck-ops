import { ForbiddenException } from '@nestjs/common';
import { db } from '@led-billboard/db';
import { RequestsService } from './requests.service';

jest.mock('@led-billboard/db', () => ({
    db: {
        select: jest.fn(),
    },
    requests: {
        id: Symbol('requests.id'),
    },
    offers: {},
    trucks: {},
    availabilitySlots: {
        id: Symbol('availability_slots.id'),
        truckId: Symbol('availability_slots.truck_id'),
    },
}));

type RequestRow = {
    id: string;
    createdBy: string;
    region: string;
    title: string;
    description: string;
    preferredStartAt: Date;
    preferredEndAt: Date;
    budgetCents: number | null;
    minScreenWidthFt: string | null;
    status: string;
    createdAt: Date;
};

const baseRequest = (): RequestRow => ({
    id: 'request-1',
    createdBy: 'broker-owner',
    region: 'DFW',
    title: 'Weekend Campaign',
    description: 'Need LED truck coverage',
    preferredStartAt: new Date('2026-02-22T09:00:00.000Z'),
    preferredEndAt: new Date('2026-02-22T18:00:00.000Z'),
    budgetCents: 250000,
    minScreenWidthFt: null,
    status: 'open',
    createdAt: new Date('2026-02-22T00:00:00.000Z'),
});

const mockRequestSelect = (request: RequestRow | null) => {
    const limit = jest
        .fn()
        .mockResolvedValue(request ? [request] : []);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });

    return { from };
};

const mockRequestOffersSelect = (
    request: RequestRow | null,
    rows: Array<{
        offer: {
            id: string;
            requestId: string;
            slotId: string | null;
            createdBy: string;
            amountCents: number;
            currency: string;
            terms: Record<string, unknown> | null;
            status: string;
            expiresAt: Date | null;
            createdAt: Date;
        };
        slot: {
            id: string;
            startAt: Date;
            endAt: Date;
            truckId: string;
        } | null;
        truck: {
            nickname: string | null;
        } | null;
    }>
) => {
    const requestQuery = mockRequestSelect(request);

    const orderBy = jest.fn().mockResolvedValue(rows);
    const where = jest.fn().mockReturnValue({ orderBy });
    const leftJoinSecond = jest.fn().mockReturnValue({ where });
    const leftJoinFirst = jest
        .fn()
        .mockReturnValue({ leftJoin: leftJoinSecond });
    const offersQuery = jest.fn().mockReturnValue({ leftJoin: leftJoinFirst });

    (db.select as unknown as jest.Mock)
        .mockReturnValueOnce(requestQuery)
        .mockReturnValueOnce({ from: offersQuery });
};

describe('RequestsService authorization', () => {
    let service: RequestsService;

    beforeEach(() => {
        jest.resetAllMocks();
        service = new RequestsService();
    });

    it('denies broker access to another broker request', async () => {
        (db.select as unknown as jest.Mock).mockReturnValue(
            mockRequestSelect(baseRequest())
        );

        await expect(
            service.getRequest('request-1', 'broker-other', 'broker')
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows owner broker to read own request', async () => {
        (db.select as unknown as jest.Mock).mockReturnValue(
            mockRequestSelect(baseRequest())
        );

        const result = await service.getRequest(
            'request-1',
            'broker-owner',
            'broker'
        );

        expect(result.id).toBe('request-1');
    });

    it('denies non-broker/non-operator role for request detail', async () => {
        (db.select as unknown as jest.Mock).mockReturnValue(
            mockRequestSelect(baseRequest())
        );

        await expect(
            service.getRequest('request-1', 'driver-1', 'driver')
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('denies broker access to offers on another broker request', async () => {
        mockRequestOffersSelect(baseRequest(), []);

        await expect(
            service.getRequestOffers('request-1', 'broker-other', 'broker')
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows operator to read request offers', async () => {
        mockRequestOffersSelect(baseRequest(), [
            {
                offer: {
                    id: 'offer-1',
                    requestId: 'request-1',
                    slotId: null,
                    createdBy: 'operator-1',
                    amountCents: 120000,
                    currency: 'USD',
                    terms: null,
                    status: 'pending',
                    expiresAt: null,
                    createdAt: new Date('2026-02-22T01:00:00.000Z'),
                },
                slot: null,
                truck: null,
            },
        ]);

        const result = await service.getRequestOffers(
            'request-1',
            'operator-1',
            'operator'
        );

        expect(result.total).toBe(1);
        expect(result.offers[0]?.id).toBe('offer-1');
    });

    it('denies non-broker/non-operator role for request offers', async () => {
        mockRequestOffersSelect(baseRequest(), []);

        await expect(
            service.getRequestOffers('request-1', 'driver-1', 'driver')
        ).rejects.toBeInstanceOf(ForbiddenException);
    });
});
