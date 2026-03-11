"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const db_1 = require("@led-billboard/db");
const requests_service_1 = require("./requests.service");
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
const baseRequest = () => ({
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
const mockRequestSelect = (request) => {
    const limit = jest
        .fn()
        .mockResolvedValue(request ? [request] : []);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });
    return { from };
};
const mockRequestOffersSelect = (request, rows) => {
    const requestQuery = mockRequestSelect(request);
    const orderBy = jest.fn().mockResolvedValue(rows);
    const where = jest.fn().mockReturnValue({ orderBy });
    const leftJoinSecond = jest.fn().mockReturnValue({ where });
    const leftJoinFirst = jest
        .fn()
        .mockReturnValue({ leftJoin: leftJoinSecond });
    const offersQuery = jest.fn().mockReturnValue({ leftJoin: leftJoinFirst });
    db_1.db.select
        .mockReturnValueOnce(requestQuery)
        .mockReturnValueOnce({ from: offersQuery });
};
describe('RequestsService authorization', () => {
    let service;
    beforeEach(() => {
        jest.resetAllMocks();
        service = new requests_service_1.RequestsService();
    });
    it('denies broker access to another broker request', async () => {
        db_1.db.select.mockReturnValue(mockRequestSelect(baseRequest()));
        await expect(service.getRequest('request-1', 'broker-other', 'broker')).rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
    it('allows owner broker to read own request', async () => {
        db_1.db.select.mockReturnValue(mockRequestSelect(baseRequest()));
        const result = await service.getRequest('request-1', 'broker-owner', 'broker');
        expect(result.id).toBe('request-1');
    });
    it('denies non-broker/non-operator role for request detail', async () => {
        db_1.db.select.mockReturnValue(mockRequestSelect(baseRequest()));
        await expect(service.getRequest('request-1', 'driver-1', 'driver')).rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
    it('denies broker access to offers on another broker request', async () => {
        mockRequestOffersSelect(baseRequest(), []);
        await expect(service.getRequestOffers('request-1', 'broker-other', 'broker')).rejects.toBeInstanceOf(common_1.ForbiddenException);
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
        const result = await service.getRequestOffers('request-1', 'operator-1', 'operator');
        expect(result.total).toBe(1);
        expect(result.offers[0]?.id).toBe('offer-1');
    });
    it('denies non-broker/non-operator role for request offers', async () => {
        mockRequestOffersSelect(baseRequest(), []);
        await expect(service.getRequestOffers('request-1', 'driver-1', 'driver')).rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
});
//# sourceMappingURL=requests.service.spec.js.map