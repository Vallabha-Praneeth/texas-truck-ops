import { BadRequestException } from '@nestjs/common';
import { z, ZodTypeAny } from 'zod';

export function parseWithSchema<T extends ZodTypeAny>(
    schema: T,
    payload: unknown,
    message = 'Invalid request payload'
): z.infer<T> {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
        throw new BadRequestException({
            error: {
                code: 'VALIDATION_ERROR',
                message,
                details: parsed.error.flatten(),
            },
        });
    }

    return parsed.data;
}
