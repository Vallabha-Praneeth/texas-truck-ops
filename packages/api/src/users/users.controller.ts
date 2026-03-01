import {
    Controller,
    Get,
    Patch,
    Body,
    Headers,
    Request,
    UseGuards,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    updateUserProfileSchema,
    UpdateUserProfileDto,
} from '@led-billboard/shared';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { parseWithSchema } from '../common/zod-validation';
import { UsersService } from './users.service';

const internalRoleUpdateSchema = z.object({
    phone: z.string().regex(/^\+1[0-9]{10}$/),
    primaryRole: z.enum(['operator', 'broker', 'driver', 'admin']),
});

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly configService: ConfigService
    ) {}

    @Get('me')
    async getMe(@Request() req) {
        const profile = await this.usersService.getProfile(req.user.id);
        if (!profile) {
            throw new NotFoundException('User not found');
        }

        return profile;
    }

    @Patch('me')
    async updateMe(@Request() req, @Body() body: unknown) {
        const dto: UpdateUserProfileDto = parseWithSchema(
            updateUserProfileSchema,
            body,
            'Invalid user update payload'
        );
        const profile = await this.usersService.updateProfile(req.user.id, dto);
        if (!profile) {
            throw new NotFoundException('User not found');
        }

        return profile;
    }

    @Get('me/organizations')
    async getMyOrganizations(@Request() req) {
        const memberships = await this.usersService.getMemberships(req.user.id);
        return { memberships };
    }

    @Patch('internal/role')
    async updateRoleInternal(
        @Headers('x-internal-key') internalKey: string | undefined,
        @Body() body: unknown
    ) {
        const expectedKey =
            this.configService.get<string>('INTERNAL_SERVICE_KEY');

        if (!expectedKey || internalKey !== expectedKey) {
            throw new ForbiddenException('Invalid internal key');
        }

        const dto = parseWithSchema(
            internalRoleUpdateSchema,
            body,
            'Invalid role update payload'
        );

        const updated = await this.usersService.updateRoleByPhone(
            dto.phone,
            dto.primaryRole
        );

        if (!updated) {
            throw new NotFoundException('User not found');
        }

        return updated;
    }
}
