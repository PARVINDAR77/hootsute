import { IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePortalSessionDto {
  @ApiProperty({ example: 'http://localhost:3000/settings/billing' })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  returnUrl: string;
}
