import { Module } from '@nestjs/common';
import { CompetitorsService } from './services/competitors.service';
import { CompetitorsController } from './controllers/competitors.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompetitorsController],
  providers: [CompetitorsService],
  exports: [CompetitorsService],
})
export class CompetitorsModule {}
