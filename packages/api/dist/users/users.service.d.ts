import { UpdateUserProfileDto } from '@led-billboard/shared';
export interface CreateUserDto {
    phone: string;
    displayName: string;
    primaryRole: 'operator' | 'broker' | 'driver' | 'admin';
    email?: string;
}
type UserRole = 'operator' | 'broker' | 'driver' | 'admin';
export declare class UsersService {
    findByPhone(phone: string): Promise<{
        id: string;
        phone: string;
        email: string;
        displayName: string;
        primaryRole: "operator" | "broker" | "driver" | "admin";
        createdAt: Date;
    }>;
    findById(id: string): Promise<{
        id: string;
        phone: string;
        email: string;
        displayName: string;
        primaryRole: "operator" | "broker" | "driver" | "admin";
        createdAt: Date;
    }>;
    create(data: CreateUserDto): Promise<{
        id: string;
        phone: string;
        email: string;
        displayName: string;
        primaryRole: "operator" | "broker" | "driver" | "admin";
        createdAt: Date;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        phone: string;
        email: string;
        displayName: string;
        primaryRole: "operator" | "broker" | "driver" | "admin";
        createdAt: string;
    }>;
    updateProfile(userId: string, dto: UpdateUserProfileDto): Promise<{
        id: string;
        phone: string;
        email: string;
        displayName: string;
        primaryRole: "operator" | "broker" | "driver" | "admin";
        createdAt: string;
    }>;
    updateRoleByPhone(phone: string, role: UserRole): Promise<{
        id: string;
        phone: string;
        email: string;
        displayName: string;
        primaryRole: "operator" | "broker" | "driver" | "admin";
        createdAt: string;
    }>;
    getMemberships(userId: string): Promise<{
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
    }[]>;
}
export {};
//# sourceMappingURL=users.service.d.ts.map