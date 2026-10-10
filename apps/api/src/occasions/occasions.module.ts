import { Module } from '@nestjs/common';
import { OccasionsService } from './occasions.service';
import { OccasionsController } from './occasions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OccasionsController],
  providers: [OccasionsService],
  exports: [OccasionsService],
})
export class OccasionsModule {}
