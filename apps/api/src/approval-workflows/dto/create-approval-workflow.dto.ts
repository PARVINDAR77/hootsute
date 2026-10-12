import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkspaceRole } from '@prisma/client';

export class CreateApprovalWorkflowStepDto {
  @ApiProperty({ description: 'Order index of the step (1-based)', example: 1 })
  @IsInt()
  @Min(1)
  stepOrder!: number;

  @ApiProperty({ description: 'Name of the approval step', example: 'Editorial & Brand Tone Review' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Minimum required workspace role to review this step',
    enum: WorkspaceRole,
    example: WorkspaceRole.EDITOR,
  })
  @IsEnum(WorkspaceRole)
  requiredRole!: WorkspaceRole;

  @ApiPropertyOptional({ description: 'Whether this step is strictly mandatory for approval', default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}

export class CreateApprovalWorkflowDto {
  @ApiProperty({ description: 'Name of the approval workflow', example: 'Two-Tier Agency & Client Review' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the workflow' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this workflow is the default for new drafts', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({
    description: 'Ordered list of approval steps',
    type: [CreateApprovalWorkflowStepDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateApprovalWorkflowStepDto)
  steps!: CreateApprovalWorkflowStepDto[];
}
