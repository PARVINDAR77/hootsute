import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { WorkspaceRole } from '@prisma/client';

export class InviteMemberDto {
  @ApiProperty({ example: 'colleague@example.com', description: 'Email address of member to invite' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email: string;

  @ApiProperty({
    enum: [WorkspaceRole.ADMIN, WorkspaceRole.EDITOR, WorkspaceRole.VIEWER],
    example: WorkspaceRole.EDITOR,
    description: 'Assigned role in the workspace. OWNER cannot be assigned via invitation.',
  })
  @IsEnum([WorkspaceRole.ADMIN, WorkspaceRole.EDITOR, WorkspaceRole.VIEWER], {
    message: 'Role must be ADMIN, EDITOR, or VIEWER',
  })
  role: WorkspaceRole;
}
