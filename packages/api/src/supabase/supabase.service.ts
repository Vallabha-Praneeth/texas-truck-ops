import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
    private _client: SupabaseClient;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const url = this.configService.get<string>('SUPABASE_URL');
        const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

        // Only initialize if valid credentials are provided (not placeholders)
        if (!url || !anonKey || url.includes('placeholder') || url.includes('your-project')) {
            console.warn('⚠️  Supabase not configured - proof upload features will not work');
            console.warn('   Add SUPABASE_URL and SUPABASE_ANON_KEY to .env to enable');
            return;
        }

        this._client = createClient(url, anonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        });
    }

    get client(): SupabaseClient {
        return this._client;
    }

    /**
     * Upload a proof image to Supabase Storage
     * @param file - The file buffer or File object
     * @param bookingId - Booking ID for path organization
     * @param driverId - Driver ID for path organization
     * @returns The public URL of the uploaded image
     */
    async uploadProofImage(
        file: Express.Multer.File,
        bookingId: string,
        driverId: string,
    ): Promise<string> {
        const timestamp = Date.now();
        const fileExtension = file.originalname.split('.').pop() || 'jpg';
        const fileName = `${timestamp}-${driverId}.${fileExtension}`;
        const filePath = `${bookingId}/${fileName}`;

        const { data, error } = await this._client.storage
            .from('proofs')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            throw new Error(`Failed to upload image: ${error.message}`);
        }

        // Get public URL
        const { data: publicUrlData } = this._client.storage
            .from('proofs')
            .getPublicUrl(data.path);

        return publicUrlData.publicUrl;
    }

    /**
     * Delete a proof image from Supabase Storage
     * @param imageUrl - The full URL of the image to delete
     */
    async deleteProofImage(imageUrl: string): Promise<void> {
        // Extract the path from the URL
        const url = new URL(imageUrl);
        const pathMatch = url.pathname.match(/\/proofs\/(.+)$/);

        if (!pathMatch) {
            throw new Error('Invalid image URL format');
        }

        const filePath = pathMatch[1];

        const { error } = await this._client.storage
            .from('proofs')
            .remove([filePath]);

        if (error) {
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }
}
