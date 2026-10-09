import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { InvitationsController } from './invitations.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceAuthGuard } from '../common/guards/workspace-auth.guard';

@Module({
  controllers: [WorkspacesController, InvitationsController],
  providers: [WorkspacesService, WorkspaceAuthGuard],
  exports: [WorkspacesService, WorkspaceAuthGuard],
})
export class WorkspacesModule {}
