import { RequestWithUser } from './request-with-user.interface';
import { Workspace, WorkspaceMember } from '@prisma/client';

export interface RequestWithWorkspace extends RequestWithUser {
  workspace: Workspace;
  workspaceMember: WorkspaceMember;
}
