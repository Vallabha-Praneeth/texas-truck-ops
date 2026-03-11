import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env file from packages/db directory
dotenv.config({ path: resolve(__dirname, '.env') });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in packages/db/.env');
}

export default {
    schema: './src/schema.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL,
    },
} satisfies Config;
