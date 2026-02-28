import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const allowedOrigins = (
        process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map((value) => value.trim())
            : [
                  'http://localhost:19006', // Expo web
                  'http://localhost:3000', // Admin Next.js (local)
                  'http://localhost:4000', // Admin Next.js (Docker)
                  'exp://localhost:19000', // Expo mobile
              ]
    ).filter(Boolean);

    // Enable CORS for mobile and admin apps
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });

    // Global prefix for API routes
    app.setGlobalPrefix('api');

    // Swagger documentation setup
    const config = new DocumentBuilder()
        .setTitle('LED Billboard Marketplace API')
        .setDescription('B2B marketplace API for mobile LED billboard truck operators and brokers')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter JWT token from /auth/verify-otp endpoint',
            },
            'JWT'
        )
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

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3010;
    await app.listen(port);

    console.log(`🚀 API server running on http://localhost:${port}/api`);
    console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
