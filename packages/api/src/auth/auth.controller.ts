import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
    sendOtpSchema,
    verifyOtpSchema,
    SendOtpDto,
    VerifyOtpDto,
} from '@led-billboard/shared';
import { JwtAuthGuard } from './jwt-auth.guard';
import { parseWithSchema } from '../common/zod-validation';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('send-otp')
    @HttpCode(HttpStatus.OK)
    async sendOtp(@Body() body: unknown) {
        const dto: SendOtpDto = parseWithSchema(
            sendOtpSchema,
            body,
            'Invalid OTP request payload'
        );
        return this.authService.sendOtp(dto.phone);
    }

    /**
     * Alias for send-otp (for compatibility with tests)
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: unknown) {
        const dto: SendOtpDto = parseWithSchema(
            sendOtpSchema,
            body,
            'Invalid OTP request payload'
        );
        return this.authService.sendOtp(dto.phone);
    }

    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    async verifyOtp(@Body() body: unknown) {
        const dto: VerifyOtpDto = parseWithSchema(
            verifyOtpSchema,
            body,
            'Invalid OTP verification payload'
        );
        return this.authService.verifyOtp(dto.phone, dto.code);
    }

    /**
     * Get current user profile (protected route)
     */
    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        return req.user;
    }
}
