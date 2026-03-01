import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    private readonly configService;
    constructor(usersService: UsersService, configService: ConfigService);
    getMe(req: any): Promise<{
        id: string;
        phone: string;
        email: string;
        displayName: string;
        primaryRole: "operator" | "broker" | "driver" | "admin";
        createdAt: string;
    }>;
    updateMe(req: any, body: unknown): Promise<{
        id: string;
        phone: string;
        email: string;
        displayName: string;
        primaryRole: "operator" | "broker" | "driver" | "admin";
        createdAt: string;
    }>;
    getMyOrganizations(req: any): Promise<{
        memberships: {
            id: string;
            orgId: string;
            userId: string;
            role: "operator" | "broker" | "driver" | "admin";
            org: {
                id: string;
                name: string;
                type: string;
                contactPhone: string;
            };
            createdAt: string;
        }[];
    }>;
    updateRoleInternal(internalKey: string | undefined, body: unknown): Promise<{
        id: string;
        phone: string;
        email: string;
        displayName: string;
        primaryRole: "operator" | "broker" | "driver" | "admin";
        createdAt: string;
    }>;
}
//# sourceMappingURL=users.controller.d.ts.map