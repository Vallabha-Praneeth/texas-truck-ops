import { IsUUID } from 'class-validator';

export class ApproveProofDto {
    @IsUUID()
    proofId: string;
}
