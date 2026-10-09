import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Public()
  @Get('info')
  @ApiOperation({ summary: 'Retrieve public workspace info for an invitation token' })
  @ApiQuery({ name: 'token', description: 'Raw invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation details' })
  @ApiResponse({ status: 404, description: 'Invalid or expired token' })
  async getInfo(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Invitation token is required');
    }
    return this.workspacesService.getInvitationByToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a workspace invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted and joined workspace' })
  @ApiResponse({ status: 400, description: 'Expired or revoked invitation' })
  @ApiResponse({ status: 409, description: 'Already accepted' })
  async accept(
    @Body() dto: AcceptInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.acceptInvitation(dto.token, user.id, user.email);
  }
}
