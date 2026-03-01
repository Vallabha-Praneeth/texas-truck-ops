import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OffersService } from './offers.service';
import {
    createOfferSchema,
    updateOfferSchema,
    CreateOfferDto,
    UpdateOfferDto,
} from '@led-billboard/shared';
import { parseWithSchema } from '../common/zod-validation';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
    constructor(private offersService: OffersService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createOffer(@Body() body: unknown, @Request() req) {
        const dto: CreateOfferDto = parseWithSchema(
            createOfferSchema,
            body,
            'Invalid offer payload'
        );
        return this.offersService.createOffer(dto, req.user.id, req.user.primaryRole);
    }

    @Get()
    async listOffers(@Request() req) {
        return this.offersService.listOffers(req.user.id, req.user.primaryRole);
    }

    @Get(':id')
    async getOffer(@Param('id') id: string, @Request() req) {
        return this.offersService.getOffer(
            id,
            req.user.id,
            req.user.primaryRole
        );
    }

    @Patch(':id')
    async updateOffer(
        @Param('id') id: string,
        @Body() body: unknown,
        @Request() req
    ) {
        const dto: UpdateOfferDto = parseWithSchema(
            updateOfferSchema,
            body,
            'Invalid offer update payload'
        );
        return this.offersService.updateOffer(id, dto, req.user.id, req.user.primaryRole);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteOffer(@Param('id') id: string, @Request() req) {
        await this.offersService.deleteOffer(id, req.user.id);
    }
}
