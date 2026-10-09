import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { WorkspaceRole, WorkspaceMemberStatus } from '@prisma/client';

export class UpdateMemberDto {
  @ApiProperty({
    enum: [WorkspaceRole.ADMIN, WorkspaceRole.EDITOR, WorkspaceRole.VIEWER],
    example: WorkspaceRole.EDITOR,
    description: 'Updated role in the workspace. OWNER cannot be assigned via role edit (use transfer-ownership).',
  })
  @IsEnum([WorkspaceRole.ADMIN, WorkspaceRole.EDITOR, WorkspaceRole.VIEWER], {
    message: 'Role must be ADMIN, EDITOR, or VIEWER',
  })
  role: WorkspaceRole;

  @ApiProperty({
    enum: [WorkspaceMemberStatus.ACTIVE, WorkspaceMemberStatus.SUSPENDED],
    example: WorkspaceMemberStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum([WorkspaceMemberStatus.ACTIVE, WorkspaceMemberStatus.SUSPENDED])
  status?: WorkspaceMemberStatus;
}
