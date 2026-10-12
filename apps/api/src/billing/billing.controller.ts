import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';

@ApiTags('Billing & Subscriptions')
@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Get('billing/plans')
  @ApiOperation({ summary: 'Get list of available subscription pricing plans and tier limits' })
  @ApiResponse({ status: 200, description: 'Plans list retrieved' })
  getPlans() {
    const plans = this.billingService.getPlans();
    return {
      success: true,
      data: plans,
    };
  }

  @Get('workspaces/:workspaceId/billing/subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER, WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Get current workspace subscription status and renewal info' })
  async getSubscription(@Param('workspaceId') workspaceId: string) {
    const subscription = await this.billingService.getSubscription(workspaceId);
    return {
      success: true,
      data: subscription,
    };
  }

  @Get('workspaces/:workspaceId/billing/invoices')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER, WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Get past billing invoices for the workspace' })
  async getInvoices(@Param('workspaceId') workspaceId: string) {
    const invoices = await this.billingService.getInvoices(workspaceId);
    return {
      success: true,
      data: invoices,
    };
  }

  @Post('workspaces/:workspaceId/billing/checkout-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Create a Stripe Checkout Session for subscription upgrade' })
  @ApiResponse({ status: 201, description: 'Checkout session created' })
  async createCheckoutSession(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateCheckoutSessionDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const session = await this.billingService.createCheckoutSession(workspaceId, userId, dto);
    return {
      success: true,
      data: session,
    };
  }

  @Post('workspaces/:workspaceId/billing/customer-portal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Generate a customer portal session to manage cards and subscriptions' })
  async createPortalSession(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreatePortalSessionDto,
  ) {
    const portal = await this.billingService.createPortalSession(workspaceId, dto);
    return {
      success: true,
      data: portal,
    };
  }

  @Public()
  @Post('billing/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook receiver for payment and subscription events' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
  ) {
    const rawBody = req.rawBody || req.body;
    if (!rawBody) {
      throw new BadRequestException('Raw request body is required for webhook signature verification');
    }

    const result = await this.billingService.handleWebhook(signature || 'mock_signature', rawBody);
    return {
      success: true,
      data: result,
    };
  }
}
