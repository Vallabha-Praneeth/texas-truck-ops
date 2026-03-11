"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const drivers_controller_1 = require("./drivers/drivers.controller");
const drivers_service_1 = require("./drivers/drivers.service");
const realtime_controller_1 = require("./realtime/realtime.controller");
const realtime_internal_controller_1 = require("./realtime/realtime.internal.controller");
const realtime_service_1 = require("./realtime/realtime.service");
describe('Realtime + Drivers controller integration', () => {
    const INTERNAL_KEY = 'test-internal-key';
    let moduleFixture;
    let realtimeController;
    let realtimeInternalController;
    let driversController;
    let realtimeService;
    let stateByUserId;
    let driversServiceMock;
    beforeAll(async () => {
        stateByUserId = new Map();
        driversServiceMock = {
            updateMyLocation: jest.fn(async (userId, role, payload) => {
                if (role !== 'driver') {
                    throw new common_1.ForbiddenException('Only drivers can access driver location endpoints');
                }
                const previous = stateByUserId.get(userId);
                const nowIso = new Date().toISOString();
                const next = {
                    userId,
                    bookingId: payload.bookingId ?? null,
                    isOnline: payload.isOnline ?? true,
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    lastSeenAt: nowIso,
                    createdAt: previous?.createdAt ?? nowIso,
                    updatedAt: nowIso,
                };
                stateByUserId.set(userId, next);
                return next;
            }),
            getMyLocation: jest.fn(async (userId, role) => {
                if (role !== 'driver') {
                    throw new common_1.ForbiddenException('Only drivers can access driver location endpoints');
                }
                return (stateByUserId.get(userId) ?? {
                    userId,
                    bookingId: null,
                    isOnline: false,
                    latitude: null,
                    longitude: null,
                    lastSeenAt: null,
                    createdAt: null,
                    updatedAt: null,
                });
            }),
            searchNearbyDrivers: jest.fn(async (query) => [
                {
                    userId: 'driver-near-1',
                    bookingId: null,
                    isOnline: true,
                    latitude: query.latitude,
                    longitude: query.longitude,
                    distanceMiles: 0,
                    lastSeenAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ]),
        };
        moduleFixture = await testing_1.Test.createTestingModule({
            controllers: [
                realtime_controller_1.RealtimeController,
                realtime_internal_controller_1.RealtimeInternalController,
                drivers_controller_1.DriversController,
            ],
            providers: [
                realtime_service_1.RealtimeService,
                {
                    provide: drivers_service_1.DriversService,
                    useValue: driversServiceMock,
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: (key) => key === 'INTERNAL_SERVICE_KEY' ? INTERNAL_KEY : undefined,
                    },
                },
            ],
        }).compile();
        realtimeController = moduleFixture.get(realtime_controller_1.RealtimeController);
        realtimeInternalController = moduleFixture.get(realtime_internal_controller_1.RealtimeInternalController);
        driversController = moduleFixture.get(drivers_controller_1.DriversController);
        realtimeService = moduleFixture.get(realtime_service_1.RealtimeService);
    });
    beforeEach(() => {
        stateByUserId.clear();
        jest.clearAllMocks();
    });
    afterAll(async () => {
        await moduleFixture.close();
    });
    describe('Realtime stream + emit', () => {
        it('returns unauthorized when user context is missing', () => {
            expect(() => realtimeController.stream({})).toThrow(common_1.UnauthorizedException);
        });
        it('rejects internal emit with invalid key', () => {
            expect(() => realtimeInternalController.emit('wrong-key', {
                channel: 'user:driver-user-1',
                event: 'booking:status_changed',
                payload: { bookingId: 'booking-123' },
            })).toThrow(common_1.ForbiddenException);
        });
        it('delivers emitted event on user stream', async () => {
            const streamPromise = waitForStreamEvent(realtimeService, 'driver-user-1', 'smoke:test');
            const emitResponse = realtimeInternalController.emit(INTERNAL_KEY, {
                channel: 'user:driver-user-1',
                event: 'smoke:test',
                payload: { message: 'hello-sse' },
            });
            expect(emitResponse).toEqual(expect.objectContaining({
                success: true,
                channel: 'user:driver-user-1',
                event: 'smoke:test',
            }));
            const event = await streamPromise;
            expect(event.type).toBe('smoke:test');
            expect(event.data).toEqual(expect.objectContaining({
                channel: 'user:driver-user-1',
                event: 'smoke:test',
                payload: { message: 'hello-sse' },
            }));
        });
    });
    describe('Drivers endpoints', () => {
        const driverRequest = () => ({
            user: {
                id: 'driver-user-1',
                primaryRole: 'driver',
            },
        });
        it('updates driver location with valid payload', async () => {
            const response = await driversController.updateMyLocation(driverRequest(), {
                latitude: 30.2672,
                longitude: -97.7431,
                isOnline: true,
            });
            expect(driversServiceMock.updateMyLocation).toHaveBeenCalledWith('driver-user-1', 'driver', expect.objectContaining({
                latitude: 30.2672,
                longitude: -97.7431,
                isOnline: true,
            }));
            expect(response.userId).toBe('driver-user-1');
            expect(response.latitude).toBe(30.2672);
        });
        it('returns current driver location for authenticated driver', async () => {
            await driversController.updateMyLocation(driverRequest(), {
                latitude: 32.7767,
                longitude: -96.797,
                isOnline: true,
            });
            const response = await driversController.getMyLocation(driverRequest());
            expect(driversServiceMock.getMyLocation).toHaveBeenCalledWith('driver-user-1', 'driver');
            expect(response.latitude).toBe(32.7767);
            expect(response.longitude).toBe(-96.797);
        });
        it('validates update payload and rejects bad data', async () => {
            await expect(driversController.updateMyLocation(driverRequest(), {
                longitude: -97.7431,
            })).rejects.toBeInstanceOf(common_1.BadRequestException);
            expect(driversServiceMock.updateMyLocation).not.toHaveBeenCalled();
        });
        it('protects nearby search with internal key', async () => {
            await expect(driversController.getNearbyDrivers('invalid', '30.2672', '-97.7431', '5')).rejects.toBeInstanceOf(common_1.ForbiddenException);
        });
        it('returns nearby drivers for valid internal key', async () => {
            const response = await driversController.getNearbyDrivers(INTERNAL_KEY, '30.2672', '-97.7431', '10', '5');
            expect(driversServiceMock.searchNearbyDrivers).toHaveBeenCalledWith({
                latitude: 30.2672,
                longitude: -97.7431,
                radiusMiles: 10,
                limit: 5,
            });
            expect(Array.isArray(response)).toBe(true);
            expect(response[0].userId).toBe('driver-near-1');
        });
    });
});
function waitForStreamEvent(realtimeService, userId, eventName, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
        let settled = false;
        let subscription = null;
        const timeout = setTimeout(() => {
            if (settled) {
                return;
            }
            settled = true;
            subscription?.unsubscribe();
            reject(new Error(`Timed out waiting for stream event: ${eventName}`));
        }, timeoutMs);
        subscription = realtimeService.streamForUser(userId).subscribe((message) => {
            if (message.type !== eventName || settled) {
                return;
            }
            settled = true;
            clearTimeout(timeout);
            subscription?.unsubscribe();
            resolve(message);
        });
    });
}
//# sourceMappingURL=realtime-drivers.api.spec.js.map