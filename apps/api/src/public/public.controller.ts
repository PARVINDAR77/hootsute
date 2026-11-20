import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';
import { CreateContactInquiryDto } from './dto/create-contact-inquiry.dto';

@ApiTags('Public Website')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Get('overview')
  @ApiOperation({ summary: 'Get real non-PII platform capability & aggregate usage counts' })
  @ApiResponse({ status: 200, description: 'Public platform overview returned' })
  async getOverview() {
    return this.publicService.getPlatformOverview();
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('contact')
  @ApiOperation({ summary: 'Submit a public contact inquiry (persisted to PostgreSQL)' })
  @ApiResponse({ status: 201, description: 'Contact inquiry received and persisted' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async submitContact(@Body() dto: CreateContactInquiryDto, @Req() req: Request) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'];
    const inquiry = await this.publicService.submitContactInquiry(dto, {
      ipAddress,
      userAgent,
    });
    return {
      message: 'Thank you for reaching out. Your inquiry has been received by our team.',
      inquiry,
    };
  }
}
