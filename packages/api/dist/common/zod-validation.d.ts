import { z, ZodTypeAny } from 'zod';
export declare function parseWithSchema<T extends ZodTypeAny>(schema: T, payload: unknown, message?: string): z.infer<T>;
//# sourceMappingURL=zod-validation.d.ts.map