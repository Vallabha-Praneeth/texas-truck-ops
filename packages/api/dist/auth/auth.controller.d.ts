import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    sendOtp(body: unknown): Promise<{
        message: string;
        expiresIn: number;
    }>;
    login(body: unknown): Promise<{
        message: string;
        expiresIn: number;
    }>;
    verifyOtp(body: unknown): Promise<{
        token: string;
        user: any;
    }>;
    getProfile(req: any): Promise<any>;
}
//# sourceMappingURL=auth.controller.d.ts.map