import { CreateOrganizationDto } from '@led-billboard/shared';
export declare class OrganizationsService {
    createOrganization(dto: CreateOrganizationDto): Promise<{
        id: string;
        name: string;
        type: string;
        contactPhone: string;
        contactEmail: string;
        taxId: string;
        createdAt: string;
    }>;
    listOrganizations(): Promise<{
        id: string;
        name: string;
        type: string;
        contactPhone: string;
        contactEmail: string;
        taxId: string;
        createdAt: string;
    }[]>;
    getOrganizationMembers(orgId: string): Promise<{
        userId: string;
        role: "operator" | "broker" | "driver" | "admin";
        joinedAt: string;
        user: {
            displayName: string;
            phone: string;
            email: string;
        };
    }[]>;
}
//# sourceMappingURL=organizations.service.d.ts.map