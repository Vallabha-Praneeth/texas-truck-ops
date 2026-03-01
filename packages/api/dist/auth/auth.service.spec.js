"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../redis/redis.service");
const users_service_1 = require("../users/users.service");
describe('AuthService', () => {
    let service;
    let redisService;
    let usersService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: jwt_1.JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock-jwt-token'),
                    },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn((key) => {
                            const config = {
                                OTP_LENGTH: 6,
                                OTP_EXPIRY_MINUTES: 10,
                                JWT_SECRET: 'test-secret',
                                JWT_EXPIRY: '7d',
                            };
                            return config[key];
                        }),
                    },
                },
                {
                    provide: redis_service_1.RedisService,
                    useValue: {
                        set: jest.fn(),
                        get: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: users_service_1.UsersService,
                    useValue: {
                        findByPhone: jest.fn(),
                        findById: jest.fn(),
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        redisService = module.get(redis_service_1.RedisService);
        usersService = module.get(users_service_1.UsersService);
    });
    describe('sendOtp', () => {
        it('should generate and store OTP for valid phone number', async () => {
            const phone = '+12145551234';
            const result = await service.sendOtp(phone);
            expect(result.message).toBe('OTP sent successfully');
            expect(result.expiresIn).toBe(600);
            expect(redisService.set).toHaveBeenCalledWith(`otp:${phone}`, expect.any(String), 600);
        });
        it('should reject invalid phone number format', async () => {
            const invalidPhone = '1234567890';
            await expect(service.sendOtp(invalidPhone)).rejects.toThrow('Invalid phone number format');
        });
    });
    describe('verifyOtp', () => {
        it('should verify correct OTP and return JWT token', async () => {
            const phone = '+12145551234';
            const code = '654321';
            const mockUser = {
                id: 'user-123',
                phone,
                displayName: 'Test User',
                primaryRole: 'broker',
                email: null,
            };
            jest.spyOn(redisService, 'get').mockResolvedValue(code);
            jest.spyOn(usersService, 'findByPhone').mockResolvedValue(mockUser);
            const result = await service.verifyOtp(phone, code);
            expect(result.token).toBe('mock-jwt-token');
            expect(result.user.id).toBe('user-123');
            expect(redisService.delete).toHaveBeenCalledWith(`otp:${phone}`);
        });
        it('should reject incorrect OTP', async () => {
            const phone = '+12145551234';
            const correctCode = '654321';
            const wrongCode = '111111';
            jest.spyOn(redisService, 'get').mockResolvedValue(correctCode);
            await expect(service.verifyOtp(phone, wrongCode)).rejects.toThrow('Invalid OTP');
        });
        it('should reject expired OTP', async () => {
            const phone = '+12145551234';
            const code = '654321';
            jest.spyOn(redisService, 'get').mockResolvedValue(null);
            await expect(service.verifyOtp(phone, code)).rejects.toThrow('OTP expired or not found');
        });
        it('should create new user on first login', async () => {
            const phone = '+12145551234';
            const code = '654321';
            const newUser = {
                id: 'new-user-123',
                phone,
                displayName: phone,
                primaryRole: 'operator',
                email: null,
            };
            jest.spyOn(redisService, 'get').mockResolvedValue(code);
            jest.spyOn(usersService, 'findByPhone').mockResolvedValue(null);
            jest.spyOn(usersService, 'create').mockResolvedValue(newUser);
            const result = await service.verifyOtp(phone, code);
            expect(usersService.create).toHaveBeenCalledWith({
                phone,
                displayName: phone,
                primaryRole: 'operator',
            });
            expect(result.user.id).toBe('new-user-123');
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map