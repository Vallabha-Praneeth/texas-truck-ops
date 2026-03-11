import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { unauthorized } from './errors';

/**
 * Authenticated user context
 */
export interface AuthContext {
    userId: string;
    primaryRole: 'broker' | 'operator' | 'admin';
    orgId?: string; // Primary organization ID (for operators)
}

/**
 * JWT payload structure
 */
interface JWTPayload {
    sub: string; // User ID
    role: 'broker' | 'operator' | 'admin';
    orgId?: string;
    iat?: number;
    exp?: number;
}

/**
 * Extract and verify JWT from Authorization header
 * 
 * @param req - Next.js request object
 * @returns AuthContext if valid, null if missing/invalid
 */
export async function verifyAuth(req: NextRequest): Promise<AuthContext | null> {
    try {
        // Extract Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return null;
        }

        // Check Bearer format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        const token = parts[1];
        if (!token) {
            return null;
        }

        // Get JWT secret from environment
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET not configured in environment');
            return null;
        }

        // Verify JWT using jose library
        const secretKey = new TextEncoder().encode(secret);
        const { payload } = await jose.jwtVerify(token, secretKey, {
            algorithms: ['HS256'],
        });

        // Extract and validate payload
        const jwtPayload = payload as unknown as JWTPayload;

        if (!jwtPayload.sub || !jwtPayload.role) {
            console.error('Invalid JWT payload: missing sub or role');
            return null;
        }

        // Return auth context
        return {
            userId: jwtPayload.sub,
            primaryRole: jwtPayload.role,
            orgId: jwtPayload.orgId,
        };
    } catch (error) {
        // JWT verification failed (expired, invalid signature, etc.)
        console.error('JWT verification failed:', error);
        return null;
    }
}

/**
 * Require authentication middleware
 * Returns AuthContext or sends 401 response
 * 
 * Usage in route handler:
 * ```
 * const auth = await requireAuth(req);
 * if (!auth) return; // 401 already sent
 * // Use auth.userId, auth.primaryRole, auth.orgId
 * ```
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext | null> {
    const auth = await verifyAuth(req);

    if (!auth) {
        return null;
    }

    return auth;
}

/**
 * Helper to get auth or return 401 response
 * Use this pattern in route handlers:
 * 
 * ```
 * const authResult = await getAuthOrUnauthorized(req);
 * if (authResult instanceof NextResponse) return authResult;
 * const auth = authResult;
 * ```
 */
export async function getAuthOrUnauthorized(
    req: NextRequest
): Promise<AuthContext | ReturnType<typeof unauthorized>> {
    const auth = await requireAuth(req);

    if (!auth) {
        return unauthorized('Missing or invalid authentication token');
    }

    return auth;
}
