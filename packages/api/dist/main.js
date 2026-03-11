"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const httpAdapter = app.getHttpAdapter().getInstance();
    if (typeof httpAdapter.disable === 'function') {
        httpAdapter.disable('x-powered-by');
    }
    app.use((_req, res, next) => {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });
    const allowedOrigins = (process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((value) => value.trim())
        : [
            'http://localhost:19006',
            'http://localhost:8001',
            'http://localhost:4000',
            'exp://localhost:19000',
        ]).filter(Boolean);
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('LED Billboard Marketplace API')
        .setDescription('B2B marketplace API for mobile LED billboard truck operators and brokers')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token from /auth/verify-otp endpoint',
    }, 'JWT')
        .addTag('auth', 'Authentication endpoints (OTP + JWT)')
        .addTag('bookings', 'Booking management')
        .addTag('offers', 'Offer management')
        .addTag('requests', 'Request management')
        .addTag('organizations', 'Organization management')
        .addTag('trucks', 'Truck fleet management')
        .addTag('slots', 'Availability slot management')
        .addTag('drivers', 'Driver location and presence management')
        .addTag('realtime', 'Server-sent events and internal event publish')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3010;
    await app.listen(port);
    console.log(`🚀 API server running on http://localhost:${port}/api`);
    console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map