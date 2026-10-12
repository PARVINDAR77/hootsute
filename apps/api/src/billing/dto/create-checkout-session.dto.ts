import { IsEnum, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan, BillingInterval } from '@packages/shared';

export class CreateCheckoutSessionDto {
  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.PRO })
  @IsEnum(SubscriptionPlan, { message: 'Plan must be one of FREE, PRO, or ENTERPRISE' })
  @IsNotEmpty()
  plan: SubscriptionPlan;

  @ApiProperty({ enum: BillingInterval, example: BillingInterval.MONTHLY })
  @IsEnum(BillingInterval, { message: 'Billing interval must be MONTHLY or YEARLY' })
  @IsNotEmpty()
  billingInterval: BillingInterval;

  @ApiProperty({ example: 'http://localhost:3000/settings/billing?checkout=success' })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  successUrl: string;

  @ApiProperty({ example: 'http://localhost:3000/settings/billing?checkout=cancelled' })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  cancelUrl: string;
}
