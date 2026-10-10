import { Module } from '@nestjs/common';
import { BrandProfileService } from './brand-profile.service';
import { BrandProfileController } from './brand-profile.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BrandProfileController],
  providers: [BrandProfileService],
  exports: [BrandProfileService],
})
export class BrandProfileModule {}
