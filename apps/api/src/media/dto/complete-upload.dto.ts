import { IsString, IsOptional } from 'class-validator';

export class CompleteUploadDto {
  @IsString()
  @IsOptional()
  etag?: string;
}
