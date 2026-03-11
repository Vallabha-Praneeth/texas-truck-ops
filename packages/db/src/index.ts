import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Lazy initialization to allow env variables to load first
let _db: ReturnType<typeof drizzle> | null = null;
let _client: postgres.Sql | null = null;

function getDb() {
    if (!_db) {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        // Create postgres client
        const client = postgres(connectionString);
        _client = client;

        // Create drizzle instance
        _db = drizzle(client, { schema });
    }

    return _db;
}

// Export lazy db getter
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(_target, prop) {
        return Reflect.get(getDb(), prop);
    }
});

export async function closeDb() {
    if (_client) {
        await _client.end({ timeout: 5 });
        _client = null;
        _db = null;
    }
}

// Export all schema tables and enums
export * from './schema';
