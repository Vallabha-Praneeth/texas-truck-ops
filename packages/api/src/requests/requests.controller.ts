import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestsService } from './requests.service';
import {
    createRequestSchema,
    updateRequestSchema,
    CreateRequestDto,
    UpdateRequestDto,
} from '@led-billboard/shared';
import { parseWithSchema } from '../common/zod-validation';

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
    constructor(private requestsService: RequestsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createRequest(@Body() body: unknown, @Request() req) {
        const dto: CreateRequestDto = parseWithSchema(
            createRequestSchema,
            body,
            'Invalid request payload'
        );
        return this.requestsService.createRequest(dto, req.user.id);
    }

    @Get()
    async listRequests(@Query() filters: { region?: string; status?: string }) {
        return this.requestsService.listRequests(filters);
    }

    @Get(':id')
    async getRequest(@Param('id') id: string, @Request() req) {
        return this.requestsService.getRequest(
            id,
            req.user.id,
            req.user.primaryRole
        );
    }

    @Patch(':id')
    async updateRequest(
        @Param('id') id: string,
        @Body() body: unknown,
        @Request() req
    ) {
        const dto: UpdateRequestDto = parseWithSchema(
            updateRequestSchema,
            body,
            'Invalid request update payload'
        );
        return this.requestsService.updateRequest(id, dto, req.user.id);
    }

    @Get(':id/offers')
    async getRequestOffers(@Param('id') id: string, @Request() req) {
        return this.requestsService.getRequestOffers(
            id,
            req.user.id,
            req.user.primaryRole
        );
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteRequest(@Param('id') id: string, @Request() req) {
        await this.requestsService.deleteRequest(id, req.user.id);
    }
}
