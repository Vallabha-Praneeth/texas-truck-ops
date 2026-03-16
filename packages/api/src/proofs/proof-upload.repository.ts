import { Injectable } from '@nestjs/common';
import { db } from '@led-billboard/db';
import { proofUploads, bookings } from '@led-billboard/db';
import { eq, and, desc } from 'drizzle-orm';

export interface CreateProofUploadData {
    bookingId: string;
    driverUserId: string;
    imageUrl: string;
    latitude?: number;
    longitude?: number;
    capturedAt: Date;
    notes?: string;
}

export interface UpdateProofStatusData {
    status: 'pending_review' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: Date;
    rejectionReason?: string;
}

@Injectable()
export class ProofUploadRepository {
    /**
     * Create a new proof upload record
     */
    async create(data: CreateProofUploadData) {
        const [proof] = await db
            .insert(proofUploads)
            .values({
                bookingId: data.bookingId,
                driverUserId: data.driverUserId,
                imageUrl: data.imageUrl,
                latitude: data.latitude?.toString(),
                longitude: data.longitude?.toString(),
                capturedAt: data.capturedAt,
                notes: data.notes,
                status: 'pending_review',
            })
            .returning();

        return proof;
    }

    /**
     * Find proof by ID
     */
    async findById(id: string) {
        const [proof] = await db
            .select()
            .from(proofUploads)
            .where(eq(proofUploads.id, id))
            .limit(1);

        return proof || null;
    }

    /**
     * Find all proofs for a booking
     */
    async findByBookingId(bookingId: string) {
        const proofs = await db
            .select()
            .from(proofUploads)
            .where(eq(proofUploads.bookingId, bookingId))
            .orderBy(desc(proofUploads.capturedAt));

        return proofs;
    }

    /**
     * Find proofs by driver
     */
    async findByDriverId(driverId: string) {
        const proofs = await db
            .select()
            .from(proofUploads)
            .where(eq(proofUploads.driverUserId, driverId))
            .orderBy(desc(proofUploads.capturedAt));

        return proofs;
    }

    /**
     * Update proof status (approve/reject)
     */
    async updateStatus(id: string, data: UpdateProofStatusData) {
        const [updated] = await db
            .update(proofUploads)
            .set({
                status: data.status,
                reviewedBy: data.reviewedBy,
                reviewedAt: data.reviewedAt,
                rejectionReason: data.rejectionReason,
                updatedAt: new Date(),
            })
            .where(eq(proofUploads.id, id))
            .returning();

        return updated;
    }

    /**
     * Delete a proof upload
     */
    async delete(id: string) {
        const [deleted] = await db
            .delete(proofUploads)
            .where(eq(proofUploads.id, id))
            .returning();

        return deleted;
    }

    /**
     * Check if booking has any approved proofs
     */
    async hasApprovedProof(bookingId: string): Promise<boolean> {
        const [proof] = await db
            .select()
            .from(proofUploads)
            .where(
                and(
                    eq(proofUploads.bookingId, bookingId),
                    eq(proofUploads.status, 'approved')
                )
            )
            .limit(1);

        return !!proof;
    }

    /**
     * Get booking by ID with validation
     */
    async getBookingById(bookingId: string) {
        const [booking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        return booking || null;
    }
}
