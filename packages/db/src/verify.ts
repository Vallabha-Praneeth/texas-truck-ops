import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
}

async function verify() {
    const sql = postgres(connectionString!);

    try {
        console.log('🔍 Verifying database schema...\n');

        // Check tables
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
        console.log(`✅ Found ${tables.length} tables:`);
        tables.forEach((t) => console.log(`   - ${t.table_name}`));

        // Check enums
        const enums = await sql`
      SELECT t.typname as enum_name
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typtype = 'e'
      GROUP BY t.typname
      ORDER BY t.typname;
    `;
        console.log(`\n✅ Found ${enums.length} enums:`);
        enums.forEach((e) => console.log(`   - ${e.enum_name}`));

        // Check PostGIS extension
        const extensions = await sql`
      SELECT extname FROM pg_extension 
      WHERE extname IN ('postgis', 'btree_gist')
      ORDER BY extname;
    `;
        console.log(`\n✅ Extensions enabled:`);
        extensions.forEach((e) => console.log(`   - ${e.extname}`));

        // Check availability_slots columns
        const columns = await sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'availability_slots'
      ORDER BY ordinal_position;
    `;
        console.log(`\n✅ availability_slots columns:`);
        columns.forEach((c) => console.log(`   - ${c.column_name}: ${c.data_type} (${c.udt_name})`));

        // Check exclusion constraint
        const constraints = await sql`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'availability_slots'::regclass
      AND contype = 'x';
    `;
        console.log(`\n✅ Exclusion constraints on availability_slots:`);
        constraints.forEach((c) => {
            console.log(`   - ${c.conname}`);
            console.log(`     ${c.definition}`);
        });

        // Check indexes
        const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'availability_slots'
      ORDER BY indexname;
    `;
        console.log(`\n✅ Indexes on availability_slots:`);
        indexes.forEach((i) => console.log(`   - ${i.indexname}`));

        await sql.end();
        console.log('\n✅ Schema verification complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        await sql.end();
        process.exit(1);
    }
}

verify();
