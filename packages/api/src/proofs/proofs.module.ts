import { Module } from '@nestjs/common';
import { ProofsController } from './proofs.controller';
import { ProofsService } from './proofs.service';
import { ProofUploadRepository } from './proof-upload.repository';
import { SupabaseModule } from '../supabase/supabase.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
    imports: [SupabaseModule, BookingsModule],
    controllers: [ProofsController],
    providers: [ProofsService, ProofUploadRepository],
    exports: [ProofsService],
})
export class ProofsModule {}
