import { Controller, Get, Post, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';
import {
    createOrganizationSchema,
    CreateOrganizationDto,
} from '@led-billboard/shared';
import { parseWithSchema } from '../common/zod-validation';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
    constructor(private organizationsService: OrganizationsService) { }

    /**
     * POST /api/organizations
     * Create a new organization
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createOrganization(@Body() body: unknown) {
        const dto: CreateOrganizationDto = parseWithSchema(
            createOrganizationSchema,
            body,
            'Invalid organization payload'
        );
        return this.organizationsService.createOrganization(dto);
    }

    /**
     * GET /api/organizations
     * List all organizations
     */
    @Get()
    async listOrganizations() {
        return this.organizationsService.listOrganizations();
    }

    /**
     * GET /api/organizations/:id/members
     * Get organization members
     */
    @Get(':id/members')
    async getMembers(@Param('id') id: string) {
        return this.organizationsService.getOrganizationMembers(id);
    }
}
