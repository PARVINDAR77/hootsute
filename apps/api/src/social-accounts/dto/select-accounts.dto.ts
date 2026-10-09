import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SocialAccountType, SocialProvider } from '@packages/shared';

export class SelectedAccountItemDto {
  @ApiProperty({ description: 'Provider Account / Page ID', example: '109823485723' })
  @IsString()
  @IsNotEmpty()
  providerAccountId: string;

  @ApiProperty({
    description: 'Social Provider',
    enum: SocialProvider,
    example: SocialProvider.META_FACEBOOK,
  })
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @ApiProperty({
    description: 'Account Type',
    enum: SocialAccountType,
    example: SocialAccountType.FACEBOOK_PAGE,
  })
  @IsEnum(SocialAccountType)
  accountType: SocialAccountType;
}

export class SelectAccountsDto {
  @ApiProperty({
    description: 'Ephemeral selection session token issued after OAuth callback',
    example: 'a7b3...64-char-hex',
  })
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @ApiProperty({
    description: 'List of accounts selected by the user to connect',
    type: [SelectedAccountItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedAccountItemDto)
  selectedAccounts: SelectedAccountItemDto[];
}
