#!/usr/bin/env node

/**
 * CLI tool for minting JWT tokens in development
 * 
 * Usage:
 *   node scripts/mint-token.mjs --userId=<uuid> --role=<role> [--orgId=<uuid>]
 *   node scripts/mint-token.mjs --userId=broker-123 --role=broker
 *   node scripts/mint-token.mjs --userId=operator-456 --role=operator --orgId=org-789
 * 
 * Options:
 *   --userId    User ID (required)
 *   --role      User role: broker, operator, admin, or driver (required)
 *   --orgId     Organization ID (optional)
 *   --help      Show this help message
 */

import { SignJWT } from 'jose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');
config({ path: envPath });

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};

    for (const arg of args) {
        if (arg === '--help' || arg === '-h') {
            showHelp();
            process.exit(0);
        }

        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            if (value) {
                parsed[key] = value;
            }
        }
    }

    return parsed;
}

function showHelp() {
    console.log(`
CLI tool for minting JWT tokens in development

Usage:
  node scripts/mint-token.mjs --userId=<uuid> --role=<role> [--orgId=<uuid>]

Examples:
  node scripts/mint-token.mjs --userId=broker-123 --role=broker
  node scripts/mint-token.mjs --userId=operator-456 --role=operator --orgId=org-789

Options:
  --userId    User ID (required)
  --role      User role: broker, operator, admin, or driver (required)
  --orgId     Organization ID (optional)
  --help      Show this help message

Environment:
  Requires JWT_SECRET to be set in .env.local
`);
}

async function mintToken(userId, role, orgId) {
    // Validate inputs
    if (!userId) {
        console.error('Error: --userId is required');
        process.exit(1);
    }

    const validRoles = ['broker', 'operator', 'admin', 'driver'];
    if (!role || !validRoles.includes(role)) {
        console.error(`Error: --role must be one of: ${validRoles.join(', ')}`);
        process.exit(1);
    }

    // Get JWT secret
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('Error: JWT_SECRET not found in environment');
        console.error('Make sure .env.local exists and contains JWT_SECRET');
        process.exit(1);
    }

    try {
        // Create JWT payload
        const payload = {
            sub: userId,
            role: role,
            ...(orgId && { orgId }),
        };

        // Sign the JWT
        const secretKey = new TextEncoder().encode(secret);
        const token = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secretKey);

        // Output the token
        console.log(token);
    } catch (error) {
        console.error('Error minting token:', error.message);
        process.exit(1);
    }
}

// Main execution
const args = parseArgs();
await mintToken(args.userId, args.role, args.orgId);
