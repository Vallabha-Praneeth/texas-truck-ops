import { OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
export declare class AuthService implements OnModuleDestroy {
    private jwtService;
    private configService;
    private redisService;
    private usersService;
    private readonly OTP_PREFIX;
    private readonly OTP_LENGTH;
    private readonly OTP_EXPIRY_SECONDS;
    private readonly cleanupTimer;
    private readonly inMemoryOtpStore;
    constructor(jwtService: JwtService, configService: ConfigService, redisService: RedisService, usersService: UsersService);
    private cleanupExpiredOtps;
    onModuleDestroy(): void;
    private withTimeout;
    private generateOtp;
    sendOtp(phone: string): Promise<{
        message: string;
        expiresIn: number;
    }>;
    verifyOtp(phone: string, code: string): Promise<{
        token: string;
        user: any;
    }>;
    validateUser(userId: string, fallback?: {
        phone?: string;
        role?: string;
    }): Promise<{
        id: string;
        phone: string;
        email: string;
        displayName: string;
        primaryRole: "operator" | "broker" | "driver" | "admin";
        createdAt: Date;
    } | {
        id: string;
        phone: string;
        displayName: string;
        primaryRole: string;
        email: any;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map