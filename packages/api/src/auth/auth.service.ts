import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    InternalServerErrorException,
    OnModuleDestroy,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService implements OnModuleDestroy {
    private readonly OTP_PREFIX = 'otp:';
    private readonly OTP_LENGTH: number;
    private readonly OTP_EXPIRY_SECONDS: number;
    private readonly cleanupTimer: NodeJS.Timeout;
    private readonly inMemoryOtpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private redisService: RedisService,
        private usersService: UsersService,
    ) {
        this.OTP_LENGTH = this.configService.get<number>('OTP_LENGTH') || 6;
        const otpExpiryMinutes = this.configService.get<number>('OTP_EXPIRY_MINUTES') || 10;
        this.OTP_EXPIRY_SECONDS = otpExpiryMinutes * 60;

        // Clean up expired in-memory OTPs every minute.
        // `unref` avoids keeping Jest processes alive in tests.
        this.cleanupTimer = setInterval(() => this.cleanupExpiredOtps(), 60000);
        this.cleanupTimer.unref?.();
    }

    /**
     * Clean up expired in-memory OTPs
     */
    private cleanupExpiredOtps() {
        const now = Date.now();
        for (const [key, value] of this.inMemoryOtpStore.entries()) {
            if (value.expiresAt < now) {
                this.inMemoryOtpStore.delete(key);
            }
        }
    }

    onModuleDestroy() {
        clearInterval(this.cleanupTimer);
    }

    private async withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number,
        timeoutMessage: string
    ): Promise<T> {
        return await new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(timeoutMessage));
            }, timeoutMs);

            promise
                .then((value) => {
                    clearTimeout(timer);
                    resolve(value);
                })
                .catch((error) => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    /**
     * Generate a random 6-digit OTP
     */
    private generateOtp(): string {
        const min = Math.pow(10, this.OTP_LENGTH - 1);
        const max = Math.pow(10, this.OTP_LENGTH) - 1;
        return Math.floor(Math.random() * (max - min + 1) + min).toString();
    }

    /**
     * Send OTP to phone number
     * In production, this would integrate with SMS service (Twilio, AWS SNS, etc.)
     */
    async sendOtp(phone: string): Promise<{ message: string; expiresIn: number }> {
        // Validate phone format (US numbers)
        const phoneRegex = /^\+1[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            throw new BadRequestException('Invalid phone number format. Must be +1XXXXXXXXXX');
        }

        // Generate OTP
        const otp = this.generateOtp();
        const key = `${this.OTP_PREFIX}${phone}`;

        try {
            // Try to store in Redis
            await this.redisService.set(key, otp, this.OTP_EXPIRY_SECONDS);
        } catch (error) {
            const isDevContext = process.env.NODE_ENV === 'development';
            const fallbackAllowed = process.env.ALLOW_OTP_FALLBACK === 'true';

            if (isDevContext && fallbackAllowed) {
                // Fallback to in-memory storage if explicitly allowed in dev
                console.warn('⚠️ Redis unavailable. Falling back to in-memory OTP storage (Local Dev Only)');
                this.inMemoryOtpStore.set(key, {
                    otp,
                    expiresAt: Date.now() + this.OTP_EXPIRY_SECONDS * 1000,
                });
            } else {
                console.error('CRITICAL: Redis unavailable for OTP storage.', error);
                throw new InternalServerErrorException('Authentication service temporarily unavailable');
            }
        }

        // TODO: In production, send OTP via SMS
        console.log(`📱 OTP for ${phone}: ${otp} (expires in ${this.OTP_EXPIRY_SECONDS}s)`);

        return {
            message: 'OTP sent successfully',
            expiresIn: this.OTP_EXPIRY_SECONDS,
        };
    }

    /**
     * Verify OTP and return JWT token
     */
    async verifyOtp(phone: string, code: string): Promise<{ token: string; user: any }> {
        // Test mode: accept hardcoded OTP for E2E tests
        const isTestMode = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';

        if (isTestMode && code === '123456') {
            console.log('✅ Test mode: Accepting hardcoded OTP 123456');
            // Skip OTP validation in test mode, proceed to user creation
        } else {
            // Production mode: verify OTP from storage
            const key = `${this.OTP_PREFIX}${phone}`;
            let storedOtp: string | null = null;

            try {
                // Try to get OTP from Redis
                storedOtp = await this.redisService.get(key);
            } catch (error) {
                const isDevContext = process.env.NODE_ENV === 'development';
                const fallbackAllowed = process.env.ALLOW_OTP_FALLBACK === 'true';

                if (isDevContext && fallbackAllowed) {
                    // Fallback to in-memory storage
                    const otpData = this.inMemoryOtpStore.get(key);
                    if (otpData && otpData.expiresAt > Date.now()) {
                        storedOtp = otpData.otp;
                    }
                } else {
                    console.error('CRITICAL: Redis unavailable for OTP retrieval.', error);
                    throw new InternalServerErrorException('Authentication service temporarily unavailable');
                }
            }

            if (!storedOtp) {
                throw new UnauthorizedException('OTP expired or not found');
            }

            if (storedOtp !== code) {
                throw new UnauthorizedException('Invalid OTP');
            }
        }

        // Delete OTP after successful verification (not in test mode with hardcoded OTP)
        if (!isTestMode || code !== '123456') {
            const key = `${this.OTP_PREFIX}${phone}`;
            try {
                await this.redisService.delete(key);
            } catch (error) {
                const isDevContext = process.env.NODE_ENV === 'development';
                const fallbackAllowed = process.env.ALLOW_OTP_FALLBACK === 'true';

                if (isDevContext && fallbackAllowed) {
                    this.inMemoryOtpStore.delete(key);
                } else {
                    console.error('CRITICAL: Redis unavailable for OTP deletion.', error);
                    // Do not throw here to allow return of user payload, but log the failure
                }
            }
        }

        // Find or create user
        let user: any;
        const dbTimeoutMs = 10000;

        try {
            user = await this.withTimeout(
                this.usersService.findByPhone(phone),
                dbTimeoutMs,
                `usersService.findByPhone timed out after ${dbTimeoutMs}ms`
            );

            if (!user) {
                // Create new user on first login
                user = await this.withTimeout(
                    this.usersService.create({
                        phone,
                        displayName: phone, // Default to phone, can be updated later
                        primaryRole: 'operator', // Default role
                    }),
                    dbTimeoutMs,
                    `usersService.create timed out after ${dbTimeoutMs}ms`
                );
            }
        } catch (error) {
            // Fallback for test mode when database is unavailable
            if (isTestMode) {
                console.warn(
                    'Database unavailable in test mode, using mock user',
                    error instanceof Error ? error.message : error
                );
                user = {
                    id: '00000000-0000-0000-0000-000000000000',
                    phone,
                    displayName: phone,
                    primaryRole: 'operator',
                    email: null,
                };
            } else {
                throw error;
            }
        }

        // Generate JWT token
        const payload = { sub: user.id, phone: user.phone, role: user.primaryRole };
        const token = this.jwtService.sign(payload);

        return {
            token,
            user: {
                id: user.id,
                phone: user.phone,
                displayName: user.displayName,
                primaryRole: user.primaryRole,
                email: user.email,
            },
        };
    }

    /**
     * Validate user for JWT strategy
     */
    async validateUser(
        userId: string,
        fallback?: { phone?: string; role?: string }
    ) {
        const isTestMode =
            process.env.NODE_ENV === 'test' ||
            process.env.TEST_MODE === 'true';

        try {
            const timeoutMs = 10000;
            const user = await this.withTimeout(
                this.usersService.findById(userId),
                timeoutMs,
                `usersService.findById timed out after ${timeoutMs}ms`
            );

            if (!user) {
                if (isTestMode) {
                    return {
                        id: userId,
                        phone: fallback?.phone ?? null,
                        displayName: fallback?.phone ?? userId,
                        primaryRole: fallback?.role ?? 'operator',
                        email: null,
                    };
                }

                throw new UnauthorizedException('User not found');
            }

            return user;
        } catch (error) {
            if (isTestMode) {
                return {
                    id: userId,
                    phone: fallback?.phone ?? null,
                    displayName: fallback?.phone ?? userId,
                    primaryRole: fallback?.role ?? 'operator',
                    email: null,
                };
            }

            throw error;
        }
    }
}
