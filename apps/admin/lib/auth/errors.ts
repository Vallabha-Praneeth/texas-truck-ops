import { NextResponse } from 'next/server';

/**
 * Standard error response shapes for authentication and authorization
 */

export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

/**
 * Return a 401 Unauthorized response
 */
export function unauthorized(message: string = 'Unauthorized'): NextResponse {
    return NextResponse.json(
        {
            error: {
                code: 'UNAUTHORIZED',
                message,
            },
        } as ErrorResponse,
        { status: 401 }
    );
}

/**
 * Return a 403 Forbidden response
 */
export function forbidden(message: string = 'Forbidden'): NextResponse {
    return NextResponse.json(
        {
            error: {
                code: 'FORBIDDEN',
                message,
            },
        } as ErrorResponse,
        { status: 403 }
    );
}

/**
 * Return a 400 Bad Request response
 */
export function badRequest(message: string, details?: unknown): NextResponse {
    return NextResponse.json(
        {
            error: {
                code: 'VALIDATION_ERROR',
                message,
                ...(details ? { details } : {}),
            },
        } as ErrorResponse,
        { status: 400 }
    );
}

/**
 * Return a 404 Not Found response
 */
export function notFound(message: string = 'Not found'): NextResponse {
    return NextResponse.json(
        {
            error: {
                code: 'NOT_FOUND',
                message,
            },
        } as ErrorResponse,
        { status: 404 }
    );
}

/**
 * Return a 409 Conflict response
 */
export function conflict(message: string): NextResponse {
    return NextResponse.json(
        {
            error: {
                code: 'CONFLICT',
                message,
            },
        } as ErrorResponse,
        { status: 409 }
    );
}

/**
 * Return a 500 Internal Server Error response
 */
export function internalError(message: string = 'An unexpected error occurred'): NextResponse {
    return NextResponse.json(
        {
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message,
            },
        } as ErrorResponse,
        { status: 500 }
    );
}
