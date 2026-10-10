import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { WhatsAppApprovalService } from '../services/whatsapp-approval.service';
import { RejectReviewActionDto } from '../dto/review-action.dto';

@ApiTags('WhatsApp Review Link Resolution & Actions')
@Controller(['whatsapp/review-link', 'review/whatsapp'])
export class WhatsAppReviewLinkController {
  constructor(private readonly approvalService: WhatsAppApprovalService) {}

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Resolve signed WhatsApp review action token and fetch draft preview' })
  async resolveReviewToken(@Param('token') token: string) {
    const details = await this.approvalService.resolveReviewDetails(token);
    return {
      success: true,
      data: details,
    };
  }

  @Post(':token/approve')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve draft directly using a valid WhatsApp reviewer action token' })
  async approveDraft(@Param('token') token: string) {
    const result = await this.approvalService.approveViaActionToken(token);
    return result;
  }

  @Post(':token/reject')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject or request changes on draft using a valid WhatsApp reviewer action token' })
  async rejectDraft(
    @Param('token') token: string,
    @Body() dto: RejectReviewActionDto,
  ) {
    const result = await this.approvalService.rejectViaActionToken(token, dto.reason);
    return result;
  }
}
