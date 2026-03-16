import { IsUUID, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateProofDto {
    @IsUUID()
    bookingId: string;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number;

    @IsString()
    capturedAt: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
