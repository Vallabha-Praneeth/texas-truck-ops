import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
    let controller: UsersController;
    let usersService: {
        getProfile: jest.Mock;
        updateProfile: jest.Mock;
        getMemberships: jest.Mock;
        updateRoleByPhone: jest.Mock;
    };

    beforeEach(async () => {
        usersService = {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            getMemberships: jest.fn(),
            updateRoleByPhone: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: usersService,
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) =>
                            key === 'INTERNAL_SERVICE_KEY'
                                ? 'test-internal-key'
                                : undefined
                        ),
                    },
                },
            ],
        }).compile();

        controller = module.get(UsersController);
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
        } as any);

        expect(usersService.getProfile).toHaveBeenCalledWith('user-1');
        expect(result.id).toBe('user-1');
    });

    it('throws not found when profile does not exist', async () => {
        usersService.getProfile.mockResolvedValue(null);

        await expect(
            controller.getMe({
                user: { id: 'missing-user' },
            } as any)
        ).rejects.toBeInstanceOf(NotFoundException);
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

        const result = await controller.updateMe(
            { user: { id: 'user-1' } } as any,
            {
                displayName: 'Updated User',
                email: 'user@example.com',
            }
        );

        expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', {
            displayName: 'Updated User',
            email: 'user@example.com',
        });
        expect(result.displayName).toBe('Updated User');
    });

    it('rejects empty update payload', async () => {
        await expect(
            controller.updateMe({ user: { id: 'user-1' } } as any, {})
        ).rejects.toBeInstanceOf(BadRequestException);
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
        } as any);

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

        const result = await controller.updateRoleInternal(
            'test-internal-key',
            {
                phone: '+12145559876',
                primaryRole: 'driver',
            }
        );

        expect(usersService.updateRoleByPhone).toHaveBeenCalledWith(
            '+12145559876',
            'driver'
        );
        expect(result.primaryRole).toBe('driver');
    });

    it('rejects role update with invalid internal key', async () => {
        await expect(
            controller.updateRoleInternal('wrong-key', {
                phone: '+12145559876',
                primaryRole: 'driver',
            })
        ).rejects.toThrow('Invalid internal key');
    });

    it('returns not found when role update target user is missing', async () => {
        usersService.updateRoleByPhone.mockResolvedValue(null);

        await expect(
            controller.updateRoleInternal('test-internal-key', {
                phone: '+12145550000',
                primaryRole: 'driver',
            })
        ).rejects.toBeInstanceOf(NotFoundException);
    });
});
