import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SentimentAnalyzerService } from './services/sentiment-analyzer.service';
import { ListeningService } from './services/listening.service';
import { ListeningController } from './controllers/listening.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ListeningController],
  providers: [SentimentAnalyzerService, ListeningService],
  exports: [ListeningService, SentimentAnalyzerService],
})
export class ListeningModule {}
