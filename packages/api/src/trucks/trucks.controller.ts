import { Controller, Get, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrucksService } from './trucks.service';
import { createTruckSchema, CreateTruckDto } from '@led-billboard/shared';
import { parseWithSchema } from '../common/zod-validation';

@Controller('trucks')
@UseGuards(JwtAuthGuard)
export class TrucksController {
    constructor(private trucksService: TrucksService) { }

    /**
     * POST /api/trucks
     * Create a new truck
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createTruck(@Body() body: unknown, @Request() req) {
        const dto: CreateTruckDto = parseWithSchema(
            createTruckSchema,
            body,
            'Invalid truck payload'
        );
        return this.trucksService.createTruck(
            dto,
            req.user.id,
            req.user.primaryRole
        );
    }

    /**
     * GET /api/trucks
     * List all trucks
     */
    @Get()
    async listTrucks() {
        return this.trucksService.listTrucks();
    }
}
