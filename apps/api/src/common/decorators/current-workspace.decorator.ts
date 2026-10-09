import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Workspace, WorkspaceMember } from '@prisma/client';

export const CurrentWorkspace = createParamDecorator(
  (data: keyof Workspace | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const workspace = request.workspace as Workspace;
    return data ? workspace?.[data] : workspace;
  },
);

export const CurrentWorkspaceMember = createParamDecorator(
  (data: keyof WorkspaceMember | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const member = request.workspaceMember as WorkspaceMember;
    return data ? member?.[data] : member;
  },
);
