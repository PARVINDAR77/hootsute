import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PushNotificationsService } from './push-notifications.service';
import {
  SubscribePushDto,
  UnsubscribePushDto,
  SendTestPushDto,
} from './dto/subscribe-push.dto';

@ApiTags('Web Push & PWA Notifications')
@Controller('notifications/push')
export class PushNotificationsController {
  constructor(
    private readonly pushService: PushNotificationsService,
  ) {}

  @Public()
  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Get application VAPID public key for browser push subscription' })
  getVapidPublicKey() {
    return this.pushService.getVapidPublicKey();
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register browser Web Push subscription for current user' })
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribePushDto,
  ) {
    return this.pushService.subscribe(userId, dto);
  }

  @Post('unsubscribe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe browser endpoint from Web Push notifications' })
  async unsubscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: UnsubscribePushDto,
  ) {
    return this.pushService.unsubscribe(userId, dto.endpoint);
  }

  @Get('subscriptions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List active push subscriptions for current user' })
  getUserSubscriptions(@CurrentUser('id') userId: string) {
    return this.pushService.getUserSubscriptions(userId);
  }

  @Post('test')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Dispatch a test push notification to current user browsers' })
  async sendTestPush(
    @CurrentUser('id') userId: string,
    @Body() dto: SendTestPushDto,
  ) {
    return this.pushService.sendNotificationToUser(userId, {
      title: dto.title || 'OmniSocial AI Test Notification',
      body: dto.body || 'Web Push notifications are active and working!',
      url: dto.url || '/dashboard',
    });
  }
}
