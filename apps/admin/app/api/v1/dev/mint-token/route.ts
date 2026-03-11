import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { z } from 'zod';

/**
 * DEV-ONLY endpoint for minting JWT tokens
 * 
 * This endpoint is only available in non-production environments.
 * It allows developers to generate valid JWT tokens for testing purposes.
 * 
 * POST /api/v1/dev/mint-token
 * 
 * Request body:
 * {
 *   "sub": "uuid-or-string-user-id",
 *   "role": "broker" | "operator" | "admin"
 * }
 * 
 * Response:
 * {
 *   "token": "eyJhbGc...",
 *   "sub": "uuid-or-string-user-id",
 *   "role": "broker"
 * }
 */

// Validation schema
const mintTokenSchema = z.object({
    sub: z.string().min(1, 'sub must be a non-empty string'),
    role: z.enum(['broker', 'operator', 'admin'], {
        errorMap: () => ({ message: 'role must be one of: broker, operator, admin' })
    }),
});

export async function POST(req: NextRequest) {
    // Security check: only allow in non-production environments
    const isDev = process.env.NODE_ENV !== 'production' || process.env.DEV_ONLY === 'true';

    if (!isDev) {
        return NextResponse.json(
            {
                error: {
                    code: 'FORBIDDEN',
                    message: 'Token minting is only available in development environments',
                },
            },
            { status: 403 }
        );
    }

    try {
        // Parse and validate request body
        const body = await req.json();
        const validationResult = mintTokenSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data',
                        details: validationResult.error.errors.map((err) => ({
                            field: err.path.join('.'),
                            message: err.message,
                        })),
                    },
                },
                { status: 400 }
            );
        }

        const { sub, role } = validationResult.data;

        // Get JWT secret from environment
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET not configured in environment');
            return NextResponse.json(
                {
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'JWT_SECRET not configured',
                    },
                },
                { status: 500 }
            );
        }

        // Create JWT payload matching require-auth expectations
        const payload = {
            sub: sub,         // Subject (user ID)
            role: role,       // User role
        };

        // Sign the JWT
        const secretKey = new TextEncoder().encode(secret);
        const token = await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h') // Token expires in 24 hours
            .sign(secretKey);

        // Return the token and metadata
        return NextResponse.json(
            {
                token,
                sub,
                role,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error minting token:', error);
        return NextResponse.json(
            {
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred',
                },
            },
            { status: 500 }
        );
    }
}
