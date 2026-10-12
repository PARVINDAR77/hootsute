import { Module } from '@nestjs/common';
import { WebhooksService } from './services/webhooks.service';
import { WebhooksController } from './controllers/webhooks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
