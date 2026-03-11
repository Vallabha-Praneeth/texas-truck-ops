"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("postgres"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
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
function isSkippableMigrationError(error, statement) {
    if (!error || typeof error !== 'object') {
        return false;
    }
    const code = 'code' in error && typeof error.code === 'string'
        ? error.code
        : undefined;
    if (!!code && IDEMPOTENT_ERROR_CODES.has(code)) {
        return true;
    }
    const normalized = statement.toLowerCase();
    const isPostgisStatement = normalized.includes('postgis') ||
        normalized.includes('geography(') ||
        normalized.includes('base_geog');
    if (!isPostgisStatement || !code) {
        return false;
    }
    return code === '0A000' || code === '42704' || code === '42703';
}
function splitStatements(sqlContent) {
    return sqlContent
        .split(STATEMENT_SPLIT_MARKER)
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);
}
async function migrate() {
    const sql = (0, postgres_1.default)(connectionString);
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
            const migrationSQL = fs.readFileSync(path.resolve(drizzleDir, filename), 'utf-8');
            const statements = splitStatements(migrationSQL);
            for (const statement of statements) {
                try {
                    await sql.unsafe(statement);
                }
                catch (error) {
                    if (isSkippableMigrationError(error, statement)) {
                        const code = error.code || 'unknown';
                        console.log(`ℹ️  Skipping idempotent statement (${code}) in ${filename}`);
                        continue;
                    }
                    throw error;
                }
            }
        }
        console.log('✅ Migration applied successfully!');
        // Verify tables exist
        console.log('\n📊 Verifying tables...');
        const tables = await sql `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
        console.log(`\nFound ${tables.length} tables:`);
        tables.forEach((t) => console.log(`  - ${t.table_name}`));
        await sql.end();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        await sql.end();
        process.exit(1);
    }
}
migrate();
//# sourceMappingURL=migrate.js.map