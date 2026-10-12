import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WhiteLabelService } from './services/white-label.service';
import { ExecutiveReportsService } from './services/executive-reports.service';
import { WhiteLabelController } from './controllers/white-label.controller';
import { ExecutiveReportsController } from './controllers/executive-reports.controller';

@Module({
  imports: [PrismaModule],
  controllers: [WhiteLabelController, ExecutiveReportsController],
  providers: [WhiteLabelService, ExecutiveReportsService],
  exports: [WhiteLabelService, ExecutiveReportsService],
})
export class ReportsModule {}
