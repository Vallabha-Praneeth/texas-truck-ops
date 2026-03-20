import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProofUploadRepository } from './proof-upload.repository';
import { SupabaseService } from '../supabase/supabase.service';
import { BookingService } from '../bookings/bookings.service';

@Injectable()
export class ProofsService {
    constructor(
        private readonly proofRepository: ProofUploadRepository,
        private readonly supabaseService: SupabaseService,
        private readonly bookingService: BookingService,
    ) {}

    /**
     * Upload a proof of performance for a booking
     */
    async uploadProof(
        file: Express.Multer.File,
        bookingId: string,
        driverId: string,
        capturedAt: string,
        latitude?: number,
        longitude?: number,
        notes?: string,
    ) {
        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only JPG and PNG images are allowed');
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new BadRequestException('File size must be less than 10MB');
        }

        // Validate booking exists and is in running state
        const booking = await this.proofRepository.getBookingById(bookingId);
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.status !== 'running') {
            throw new BadRequestException(
                `Cannot upload proof for booking with status: ${booking.status}. Booking must be in 'running' state.`
            );
        }

        // Verify driver is assigned to this booking
        if (booking.driverUserId !== driverId) {
            throw new ForbiddenException('Only the assigned driver can upload proof for this booking');
        }

        // Upload image to Supabase Storage
        const imageUrl = await this.supabaseService.uploadProofImage(
            file,
            bookingId,
            driverId,
        );

        // Create proof upload record
        const proof = await this.proofRepository.create({
            bookingId,
            driverUserId: driverId,
            imageUrl,
            latitude,
            longitude,
            capturedAt: new Date(capturedAt),
            notes,
        });

        // Transition booking to awaiting_review status
        await this.bookingService.transitionBookingStatus(
            bookingId,
            'awaiting_review' as any,
        );

        return proof;
    }

    /**
     * Get proof by ID
     */
    async getProofById(id: string) {
        const proof = await this.proofRepository.findById(id);
        if (!proof) {
            throw new NotFoundException('Proof not found');
        }
        return proof;
    }

    /**
     * Get all proofs for a booking
     */
    async getProofsByBookingId(bookingId: string) {
        return this.proofRepository.findByBookingId(bookingId);
    }

    /**
     * Approve a proof (broker/operator only)
     */
    async approveProof(proofId: string, reviewerId: string) {
        const proof = await this.proofRepository.findById(proofId);
        if (!proof) {
            throw new NotFoundException('Proof not found');
        }

        if (proof.status !== 'pending_review') {
            throw new BadRequestException(
                `Cannot approve proof with status: ${proof.status}`
            );
        }

        // Update proof status
        const updatedProof = await this.proofRepository.updateStatus(proofId, {
            status: 'approved',
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
        });

        // Check if booking can be completed
        const booking = await this.proofRepository.getBookingById(proof.bookingId);
        if (booking && booking.status === 'awaiting_review') {
            // Transition booking to completed
            await this.bookingService.transitionBookingStatus(
                proof.bookingId,
                'completed' as any,
                {
                    completedAt: new Date(),
                }
            );
        }

        return updatedProof;
    }

    /**
     * Reject a proof (broker/operator only)
     */
    async rejectProof(proofId: string, reviewerId: string, reason: string) {
        const proof = await this.proofRepository.findById(proofId);
        if (!proof) {
            throw new NotFoundException('Proof not found');
        }

        if (proof.status !== 'pending_review') {
            throw new BadRequestException(
                `Cannot reject proof with status: ${proof.status}`
            );
        }

        // Update proof status
        const updatedProof = await this.proofRepository.updateStatus(proofId, {
            status: 'rejected',
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            rejectionReason: reason,
        });

        // Keep booking in awaiting_review state so driver can re-upload

        return updatedProof;
    }

    /**
     * Delete a proof (driver only, before review)
     */
    async deleteProof(proofId: string, userId: string) {
        const proof = await this.proofRepository.findById(proofId);
        if (!proof) {
            throw new NotFoundException('Proof not found');
        }

        // Only allow deletion if proof is pending review
        if (proof.status !== 'pending_review') {
            throw new BadRequestException(
                'Can only delete proofs that are pending review'
            );
        }

        // Only allow driver who uploaded to delete
        if (proof.driverUserId !== userId) {
            throw new ForbiddenException('Only the uploader can delete this proof');
        }

        // Delete image from storage
        try {
            await this.supabaseService.deleteProofImage(proof.imageUrl);
        } catch (error) {
            // Log error but continue with database deletion
            console.error('Failed to delete proof image from storage:', error);
        }

        // Delete proof record
        return this.proofRepository.delete(proofId);
    }
}
