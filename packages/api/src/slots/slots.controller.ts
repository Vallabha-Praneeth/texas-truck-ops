import { Controller, Get, Post, Body, Query, Param, Patch, Delete, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SlotsService } from './slots.service';
import {
    createSlotSchema,
    updateSlotSchema,
    searchSlotsSchema,
    CreateSlotDto,
    UpdateSlotDto,
    SearchSlotsDto,
} from '@led-billboard/shared';
import { parseWithSchema } from '../common/zod-validation';

@Controller('slots')
@UseGuards(JwtAuthGuard)
export class SlotsController {
    constructor(private slotsService: SlotsService) { }

    /**
     * POST /api/slots
     * Create a new availability slot
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createSlot(@Body() body: unknown, @Request() req) {
        const dto: CreateSlotDto = parseWithSchema(
            createSlotSchema,
            body,
            'Invalid slot payload'
        );
        return this.slotsService.createSlot(
            dto,
            req.user.id,
            req.user.primaryRole
        );
    }

    /**
     * GET /api/slots/search
     * Search for available slots
     */
    @Get('search')
    async searchSlots(@Query() query: unknown) {
        const filters: SearchSlotsDto = parseWithSchema(
            searchSlotsSchema,
            query,
            'Invalid slot search filters'
        );
        return this.slotsService.searchSlots(filters);
    }

    /**
     * GET /api/slots/:id
     * Get a single slot by ID
     */
    @Get(':id')
    async getSlot(@Param('id') id: string, @Request() req) {
        return this.slotsService.getSlot(id, req.user.id, req.user.primaryRole);
    }

    /**
     * PATCH /api/slots/:id
     * Update an existing slot
     */
    @Patch(':id')
    async updateSlot(
        @Param('id') id: string,
        @Body() body: unknown,
        @Request() req
    ) {
        const dto: UpdateSlotDto = parseWithSchema(
            updateSlotSchema,
            body,
            'Invalid slot update payload'
        );
        return this.slotsService.updateSlot(
            id,
            dto,
            req.user.id,
            req.user.primaryRole
        );
    }

    /**
     * DELETE /api/slots/:id
     * Delete a slot
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteSlot(@Param('id') id: string, @Request() req) {
        await this.slotsService.deleteSlot(id, req.user.id, req.user.primaryRole);
    }
}
