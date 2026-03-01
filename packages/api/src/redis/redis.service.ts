import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private client: Redis | null = null;
    private readonly isTestMode: boolean;

    constructor(private configService: ConfigService) {
        this.isTestMode = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';

        // Skip Redis in test mode - use in-memory storage in auth.service.ts
        if (this.isTestMode) {
            console.log('🧪 Test mode: Redis disabled, using in-memory storage');
            return;
        }

        const redisUrl = this.configService.get<string>('REDIS_URL');

        if (!redisUrl) {
            throw new Error('REDIS_URL is not configured');
        }

        this.client = new Redis(redisUrl);

        this.client.on('error', (err) => {
            console.error('🚨 Redis connection error:', err);
        });

        this.client.on('connect', () => {
            console.log('✅ Connected to Redis');
        });

        this.client.on('ready', () => {
            console.log('✅ Redis is ready');
        });
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (!this.client) {
            throw new Error('Redis not available in test mode');
        }
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        if (!this.client) {
            throw new Error('Redis not available in test mode');
        }
        return await this.client.get(key);
    }

    async delete(key: string): Promise<void> {
        if (!this.client) {
            throw new Error('Redis not available in test mode');
        }
        await this.client.del(key);
    }

    async exists(key: string): Promise<boolean> {
        if (!this.client) {
            throw new Error('Redis not available in test mode');
        }
        const result = await this.client.exists(key);
        return result === 1;
    }

    onModuleDestroy() {
        if (this.client) {
            this.client.disconnect();
        }
    }
}
