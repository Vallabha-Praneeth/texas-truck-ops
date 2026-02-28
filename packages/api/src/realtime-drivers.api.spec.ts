import {
  BadRequestException,
  ForbiddenException,
  MessageEvent,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DriversController } from './drivers/drivers.controller';
import { DriversService } from './drivers/drivers.service';
import { RealtimeController } from './realtime/realtime.controller';
import { RealtimeInternalController } from './realtime/realtime.internal.controller';
import { RealtimeService } from './realtime/realtime.service';

describe('Realtime + Drivers controller integration', () => {
  const INTERNAL_KEY = 'test-internal-key';

  let moduleFixture: TestingModule;
  let realtimeController: RealtimeController;
  let realtimeInternalController: RealtimeInternalController;
  let driversController: DriversController;
  let realtimeService: RealtimeService;
  let stateByUserId: Map<string, any>;
  let driversServiceMock: {
    updateMyLocation: jest.Mock;
    getMyLocation: jest.Mock;
    searchNearbyDrivers: jest.Mock;
  };

  beforeAll(async () => {
    stateByUserId = new Map<string, any>();

    driversServiceMock = {
      updateMyLocation: jest.fn(async (userId, role, payload) => {
        if (role !== 'driver') {
          throw new ForbiddenException(
            'Only drivers can access driver location endpoints'
          );
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
          throw new ForbiddenException(
            'Only drivers can access driver location endpoints'
          );
        }

        return (
          stateByUserId.get(userId) ?? {
            userId,
            bookingId: null,
            isOnline: false,
            latitude: null,
            longitude: null,
            lastSeenAt: null,
            createdAt: null,
            updatedAt: null,
          }
        );
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

    moduleFixture = await Test.createTestingModule({
      controllers: [
        RealtimeController,
        RealtimeInternalController,
        DriversController,
      ],
      providers: [
        RealtimeService,
        {
          provide: DriversService,
          useValue: driversServiceMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'INTERNAL_SERVICE_KEY' ? INTERNAL_KEY : undefined,
          },
        },
      ],
    }).compile();

    realtimeController = moduleFixture.get(RealtimeController);
    realtimeInternalController = moduleFixture.get(RealtimeInternalController);
    driversController = moduleFixture.get(DriversController);
    realtimeService = moduleFixture.get(RealtimeService);
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
      expect(() => realtimeController.stream({})).toThrow(
        UnauthorizedException
      );
    });

    it('rejects internal emit with invalid key', () => {
      expect(() =>
        realtimeInternalController.emit('wrong-key', {
          channel: 'user:driver-user-1',
          event: 'booking:status_changed',
          payload: { bookingId: 'booking-123' },
        })
      ).toThrow(ForbiddenException);
    });

    it('delivers emitted event on user stream', async () => {
      const streamPromise = waitForStreamEvent(
        realtimeService,
        'driver-user-1',
        'smoke:test'
      );

      const emitResponse = realtimeInternalController.emit(INTERNAL_KEY, {
        channel: 'user:driver-user-1',
        event: 'smoke:test',
        payload: { message: 'hello-sse' },
      });

      expect(emitResponse).toEqual(
        expect.objectContaining({
          success: true,
          channel: 'user:driver-user-1',
          event: 'smoke:test',
        })
      );

      const event = await streamPromise;
      expect(event.type).toBe('smoke:test');
      expect(event.data).toEqual(
        expect.objectContaining({
          channel: 'user:driver-user-1',
          event: 'smoke:test',
          payload: { message: 'hello-sse' },
        })
      );
    });
  });

  describe('Drivers endpoints', () => {
    const driverRequest = () =>
      ({
        user: {
          id: 'driver-user-1',
          primaryRole: 'driver',
        },
      }) as any;

    it('updates driver location with valid payload', async () => {
      const response = await driversController.updateMyLocation(driverRequest(), {
        latitude: 30.2672,
        longitude: -97.7431,
        isOnline: true,
      });

      expect(driversServiceMock.updateMyLocation).toHaveBeenCalledWith(
        'driver-user-1',
        'driver',
        expect.objectContaining({
          latitude: 30.2672,
          longitude: -97.7431,
          isOnline: true,
        })
      );
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

      expect(driversServiceMock.getMyLocation).toHaveBeenCalledWith(
        'driver-user-1',
        'driver'
      );
      expect(response.latitude).toBe(32.7767);
      expect(response.longitude).toBe(-96.797);
    });

    it('validates update payload and rejects bad data', async () => {
      await expect(
        driversController.updateMyLocation(driverRequest(), {
          longitude: -97.7431,
        })
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(driversServiceMock.updateMyLocation).not.toHaveBeenCalled();
    });

    it('protects nearby search with internal key', async () => {
      await expect(
        driversController.getNearbyDrivers(
          'invalid',
          '30.2672',
          '-97.7431',
          '5'
        )
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns nearby drivers for valid internal key', async () => {
      const response = await driversController.getNearbyDrivers(
        INTERNAL_KEY,
        '30.2672',
        '-97.7431',
        '10',
        '5'
      );

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

function waitForStreamEvent(
  realtimeService: RealtimeService,
  userId: string,
  eventName: string,
  timeoutMs = 3000
): Promise<MessageEvent> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription: { unsubscribe: () => void } | null = null;

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
