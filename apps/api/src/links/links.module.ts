import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LinksService } from './services/links.service';
import { LinksController } from './controllers/links.controller';
import { LinkRedirectController } from './controllers/link-redirect.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LinksController, LinkRedirectController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}
