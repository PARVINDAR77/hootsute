import {
  Controller,
  Get,
  Post,
  Query,
  Headers,
  Req,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { WhatsAppWebhookService } from '../services/whatsapp-webhook.service';

@ApiTags('WhatsApp Webhooks')
@Controller(['whatsapp/webhook', 'webhooks/whatsapp'])
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(private readonly webhookService: WhatsAppWebhookService) {}

  /**
   * Meta Webhook Subscription Verification Handshake
   * GET /api/v1/whatsapp/webhook?hub.mode=subscribe&hub.challenge=...&hub.verify_token=...
   */
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
    // Meta requires the challenge string returned as plaintext with 200 OK
    return res.status(HttpStatus.OK).send(verifiedChallenge);
  }

  /**
   * Meta Inbound Webhook Event Notifications
   * POST /api/v1/whatsapp/webhook
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Meta Webhook Inbound Notifications (Statuses and Inbound Messages)' })
  async handleWebhookEvent(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: any,
  ) {
    const rawBuffer = req.rawBody || Buffer.from(JSON.stringify(body || {}));

    // Verify HMAC-SHA256 signature
    this.webhookService.verifySignature(rawBuffer, signature);

    // Process event payload with deduplication
    const result = await this.webhookService.processWebhookPayload(body);

    return {
      success: true,
      message: 'Webhook event processed',
      ...result,
    };
  }
}
