import { OrganizationsService } from './organizations.service';
export declare class OrganizationsController {
    private organizationsService;
    constructor(organizationsService: OrganizationsService);
    createOrganization(body: unknown): Promise<{
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
    getMembers(id: string): Promise<{
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
//# sourceMappingURL=organizations.controller.d.ts.map