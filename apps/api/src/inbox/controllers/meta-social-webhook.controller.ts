import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Res } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { MetaSocialWebhookService } from '../services/meta-social-webhook.service';

@ApiTags('Meta Social Webhooks')
@Controller(['webhooks/meta', 'meta/webhook'])
export class MetaSocialWebhookController {
  private readonly logger = new Logger(MetaSocialWebhookController.name);

  constructor(private readonly webhookService: MetaSocialWebhookService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Meta Webhook Handshake Verification (hub.challenge)' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifiedChallenge = this.webhookService.verifyChallenge(mode, token, challenge);
    return res.status(HttpStatus.OK).send(verifiedChallenge);
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Meta Inbound Webhook Event Notifications' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature?: string,
  ): Promise<{ status: string; processed: number; duplicates: number }> {
    const rawBuffer = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    this.webhookService.verifySignature(rawBuffer, signature);

    const result = await this.webhookService.processWebhookPayload(req.body);
    return {
      status: 'EVENT_RECEIVED',
      processed: result.processed,
      duplicates: result.duplicates,
    };
  }
}
