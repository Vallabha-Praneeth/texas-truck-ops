import { IsUUID, IsString, MinLength, MaxLength } from 'class-validator';

export class RejectProofDto {
    @IsUUID()
    proofId: string;

    @IsString()
    @MinLength(1)
    @MaxLength(500)
    reason: string;
}
