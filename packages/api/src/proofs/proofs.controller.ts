import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    Request,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProofsService } from './proofs.service';
import { CreateProofDto } from './dto/create-proof.dto';
import { RejectProofDto } from './dto/reject-proof.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('proofs')
@UseGuards(JwtAuthGuard)
export class ProofsController {
    constructor(private readonly proofsService: ProofsService) {}

    /**
     * Upload a proof of performance
     * POST /api/proofs
     */
    @Post()
    @UseInterceptors(FileInterceptor('image'))
    async uploadProof(
        @UploadedFile() file: Express.Multer.File,
        @Body() createProofDto: CreateProofDto,
        @Request() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('Image file is required');
        }

        const userId = req.user.userId;

        return this.proofsService.uploadProof(
            file,
            createProofDto.bookingId,
            userId,
            createProofDto.capturedAt,
            createProofDto.latitude,
            createProofDto.longitude,
            createProofDto.notes,
        );
    }

    /**
     * Get proof by ID
     * GET /api/proofs/:id
     */
    @Get(':id')
    async getProof(@Param('id') id: string) {
        return this.proofsService.getProofById(id);
    }

    /**
     * Get all proofs for a booking
     * GET /api/proofs/booking/:bookingId
     */
    @Get('booking/:bookingId')
    async getProofsByBooking(@Param('bookingId') bookingId: string) {
        return this.proofsService.getProofsByBookingId(bookingId);
    }

    /**
     * Approve a proof (broker/operator only)
     * PATCH /api/proofs/:id/approve
     */
    @Patch(':id/approve')
    async approveProof(@Param('id') id: string, @Request() req: any) {
        const reviewerId = req.user.userId;
        return this.proofsService.approveProof(id, reviewerId);
    }

    /**
     * Reject a proof (broker/operator only)
     * PATCH /api/proofs/:id/reject
     */
    @Patch(':id/reject')
    async rejectProof(
        @Param('id') id: string,
        @Body() rejectProofDto: RejectProofDto,
        @Request() req: any,
    ) {
        const reviewerId = req.user.userId;
        return this.proofsService.rejectProof(id, reviewerId, rejectProofDto.reason);
    }

    /**
     * Delete a proof (driver only, before review)
     * DELETE /api/proofs/:id
     */
    @Delete(':id')
    async deleteProof(@Param('id') id: string, @Request() req: any) {
        const userId = req.user.userId;
        return this.proofsService.deleteProof(id, userId);
    }
}
