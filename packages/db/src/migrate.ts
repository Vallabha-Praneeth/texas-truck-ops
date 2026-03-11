import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
}

const STATEMENT_SPLIT_MARKER = '--> statement-breakpoint';
const IDEMPOTENT_ERROR_CODES = new Set([
    '42710', // duplicate_object
    '42P07', // duplicate_table
    '42701', // duplicate_column
]);

function isSkippableMigrationError(
    error: unknown,
    statement: string
): boolean {
    if (!error || typeof error !== 'object') {
        return false;
    }

    const code =
        'code' in error && typeof (error as { code?: unknown }).code === 'string'
            ? (error as { code: string }).code
            : undefined;

    if (!!code && IDEMPOTENT_ERROR_CODES.has(code)) {
        return true;
    }

    const normalized = statement.toLowerCase();
    const isPostgisStatement =
        normalized.includes('postgis') ||
        normalized.includes('geography(') ||
        normalized.includes('base_geog');

    if (!isPostgisStatement || !code) {
        return false;
    }

    return code === '0A000' || code === '42704' || code === '42703';
}

function splitStatements(sqlContent: string): string[] {
    return sqlContent
        .split(STATEMENT_SPLIT_MARKER)
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);
}

async function migrate() {
    const sql = postgres(connectionString!);

    try {
        console.log('🔄 Reading migration files...');

        // Find migration files
        const drizzleDir = path.resolve(__dirname, '../drizzle');
        const files = fs.readdirSync(drizzleDir);
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

        if (sqlFiles.length === 0) {
            throw new Error('No migration files found in drizzle directory');
        }

        for (const filename of sqlFiles) {
            console.log(`📄 Applying migration: ${filename}`);

            const migrationSQL = fs.readFileSync(
                path.resolve(drizzleDir, filename),
                'utf-8'
            );
            const statements = splitStatements(migrationSQL);

            for (const statement of statements) {
                try {
                    await sql.unsafe(statement);
                } catch (error) {
                    if (isSkippableMigrationError(error, statement)) {
                        const code = (error as { code?: string }).code || 'unknown';
                        console.log(
                            `ℹ️  Skipping idempotent statement (${code}) in ${filename}`
                        );
                        continue;
                    }

                    throw error;
                }
            }
        }

        console.log('✅ Migration applied successfully!');

        // Verify tables exist
        console.log('\n📊 Verifying tables...');
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

        console.log(`\nFound ${tables.length} tables:`);
        tables.forEach((t) => console.log(`  - ${t.table_name}`));

        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await sql.end();
        process.exit(1);
    }
}

migrate();
