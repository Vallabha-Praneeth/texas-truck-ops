"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWithSchema = parseWithSchema;
const common_1 = require("@nestjs/common");
function parseWithSchema(schema, payload, message = 'Invalid request payload') {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
        throw new common_1.BadRequestException({
            error: {
                code: 'VALIDATION_ERROR',
                message,
                details: parsed.error.flatten(),
            },
        });
    }
    return parsed.data;
}
//# sourceMappingURL=zod-validation.js.map