import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApprovalWorkflowsService } from './services/approval-workflows.service';
import { DraftCommentsService } from './services/draft-comments.service';
import { ApprovalWorkflowsController } from './controllers/approval-workflows.controller';
import { DraftApprovalsController } from './controllers/draft-approvals.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ApprovalWorkflowsController, DraftApprovalsController],
  providers: [ApprovalWorkflowsService, DraftCommentsService],
  exports: [ApprovalWorkflowsService, DraftCommentsService],
})
export class ApprovalWorkflowsModule {}
