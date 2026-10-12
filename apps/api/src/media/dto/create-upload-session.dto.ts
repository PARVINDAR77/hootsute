import { IsString, IsNotEmpty, IsInt, Min, Max, Matches, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
];

export class CreateUploadSessionDto {
  @IsString()
  @IsNotEmpty({ message: 'Filename is required' })
  @Matches(/^[^<>:"/\\|?*\x00-\x1F]+$/, {
    message: 'Filename contains invalid or dangerous characters',
  })
  filename: string;

  @IsString()
  @IsNotEmpty({ message: 'MIME type is required' })
  @IsIn(ALLOWED_MIME_TYPES, {
    message: `Unsupported MIME type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
  })
  mimeType: string;

  @Type(() => Number)
  @IsInt({ message: 'File size must be an integer in bytes' })
  @Min(1, { message: 'File size must be at least 1 byte' })
  @Max(104857600, { message: 'File size cannot exceed 100MB (104,857,600 bytes)' })
  sizeBytes: number;
}
