import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    Headers,
    InternalServerErrorException,
    Patch,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    searchNearbyDriversSchema,
    updateDriverLocationSchema,
} from '@led-billboard/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DriversService } from './drivers.service';
import { parseWithSchema } from '../common/zod-validation';

@Controller('drivers')
export class DriversController {
    constructor(
        private readonly configService: ConfigService,
        private readonly driversService: DriversService
    ) {}

    @Patch('me/location')
    @UseGuards(JwtAuthGuard)
    async updateMyLocation(@Request() req, @Body() body: unknown) {
        const parsed = parseWithSchema(
            updateDriverLocationSchema,
            body,
            'Invalid location payload'
        );
        return this.driversService.updateMyLocation(
            req.user.id,
            req.user.primaryRole,
            parsed
        );
    }

    @Get('me/location')
    @UseGuards(JwtAuthGuard)
    async getMyLocation(@Request() req) {
        return this.driversService.getMyLocation(
            req.user.id,
            req.user.primaryRole
        );
    }

    @Get('nearby')
    async getNearbyDrivers(
        @Headers('x-internal-key') internalKey: string | undefined,
        @Query('latitude') latitude: string,
        @Query('longitude') longitude: string,
        @Query('radiusMiles') radiusMiles?: string,
        @Query('limit') limit?: string
    ) {
        const expectedInternalKey =
            this.configService.get<string>('INTERNAL_SERVICE_KEY');
        if (!expectedInternalKey) {
            throw new InternalServerErrorException(
                'INTERNAL_SERVICE_KEY is not configured'
            );
        }

        if (!internalKey || internalKey !== expectedInternalKey) {
            throw new ForbiddenException('Invalid internal key');
        }

        const parsed = parseWithSchema(
            searchNearbyDriversSchema,
            {
                latitude: Number(latitude),
                longitude: Number(longitude),
                radiusMiles:
                    radiusMiles !== undefined ? Number(radiusMiles) : undefined,
                limit: limit !== undefined ? Number(limit) : undefined,
            },
            'Invalid nearby search parameters'
        );

        return this.driversService.searchNearbyDrivers(parsed);
    }
}
