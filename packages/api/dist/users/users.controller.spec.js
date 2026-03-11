"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const users_controller_1 = require("./users.controller");
const users_service_1 = require("./users.service");
describe('UsersController', () => {
    let controller;
    let usersService;
    beforeEach(async () => {
        usersService = {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            getMemberships: jest.fn(),
            updateRoleByPhone: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            controllers: [users_controller_1.UsersController],
            providers: [
                {
                    provide: users_service_1.UsersService,
                    useValue: usersService,
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn((key) => key === 'INTERNAL_SERVICE_KEY'
                            ? 'test-internal-key'
                            : undefined),
                    },
                },
            ],
        }).compile();
        controller = module.get(users_controller_1.UsersController);
    });
    it('returns current user profile', async () => {
        usersService.getProfile.mockResolvedValue({
            id: 'user-1',
            phone: '+12145551234',
            displayName: 'Test User',
            primaryRole: 'operator',
            email: null,
            createdAt: '2026-02-17T00:00:00.000Z',
        });
        const result = await controller.getMe({
            user: { id: 'user-1' },
        });
        expect(usersService.getProfile).toHaveBeenCalledWith('user-1');
        expect(result.id).toBe('user-1');
    });
    it('throws not found when profile does not exist', async () => {
        usersService.getProfile.mockResolvedValue(null);
        await expect(controller.getMe({
            user: { id: 'missing-user' },
        })).rejects.toBeInstanceOf(common_1.NotFoundException);
    });
    it('updates current user profile', async () => {
        usersService.updateProfile.mockResolvedValue({
            id: 'user-1',
            phone: '+12145551234',
            displayName: 'Updated User',
            primaryRole: 'operator',
            email: 'user@example.com',
            createdAt: '2026-02-17T00:00:00.000Z',
        });
        const result = await controller.updateMe({ user: { id: 'user-1' } }, {
            displayName: 'Updated User',
            email: 'user@example.com',
        });
        expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', {
            displayName: 'Updated User',
            email: 'user@example.com',
        });
        expect(result.displayName).toBe('Updated User');
    });
    it('rejects empty update payload', async () => {
        await expect(controller.updateMe({ user: { id: 'user-1' } }, {})).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('returns current user memberships', async () => {
        usersService.getMemberships.mockResolvedValue([
            {
                id: 'membership-1',
                orgId: 'org-1',
                userId: 'user-1',
                role: 'operator',
                org: {
                    id: 'org-1',
                    name: 'Test Org',
                    type: 'operator',
                    contactPhone: '+12145551234',
                },
                createdAt: '2026-02-17T00:00:00.000Z',
            },
        ]);
        const result = await controller.getMyOrganizations({
            user: { id: 'user-1' },
        });
        expect(usersService.getMemberships).toHaveBeenCalledWith('user-1');
        expect(result.memberships).toHaveLength(1);
    });
    it('updates user role with valid internal key', async () => {
        usersService.updateRoleByPhone.mockResolvedValue({
            id: 'user-driver-1',
            phone: '+12145559876',
            displayName: 'Driver User',
            primaryRole: 'driver',
            email: null,
            createdAt: '2026-02-17T00:00:00.000Z',
        });
        const result = await controller.updateRoleInternal('test-internal-key', {
            phone: '+12145559876',
            primaryRole: 'driver',
        });
        expect(usersService.updateRoleByPhone).toHaveBeenCalledWith('+12145559876', 'driver');
        expect(result.primaryRole).toBe('driver');
    });
    it('rejects role update with invalid internal key', async () => {
        await expect(controller.updateRoleInternal('wrong-key', {
            phone: '+12145559876',
            primaryRole: 'driver',
        })).rejects.toThrow('Invalid internal key');
    });
    it('returns not found when role update target user is missing', async () => {
        usersService.updateRoleByPhone.mockResolvedValue(null);
        await expect(controller.updateRoleInternal('test-internal-key', {
            phone: '+12145550000',
            primaryRole: 'driver',
        })).rejects.toBeInstanceOf(common_1.NotFoundException);
    });
});
//# sourceMappingURL=users.controller.spec.js.map