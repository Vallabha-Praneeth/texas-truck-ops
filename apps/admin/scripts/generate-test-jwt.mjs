#!/usr/bin/env node

/**
 * Generate a test JWT token for development
 * Usage: node scripts/generate-test-jwt.mjs [userId] [role] [orgId]
 */

import * as jose from 'jose';

const userId = process.argv[2] || '00000000-0000-0000-0000-000000000001';
const role = process.argv[3] || 'broker';
const orgId = process.argv[4] || undefined;

// Get JWT secret from environment
const secret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

async function generateToken() {
    try {
        const secretKey = new TextEncoder().encode(secret);

        const token = await new jose.SignJWT({
            sub: userId,
            role: role,
            ...(orgId && { orgId }),
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secretKey);

        console.log(token);
    } catch (error) {
        console.error('Error generating token:', error);
        process.exit(1);
    }
}

generateToken();
