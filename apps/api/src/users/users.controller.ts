import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get authenticated user UI preferences' })
  @ApiResponse({ status: 200, description: 'User preferences retrieved' })
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    const record = await this.usersService.findById(user.id);
    return {
      themePreference: record?.themePreference || 'light',
    };
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update authenticated user UI preferences (e.g. light/dark theme)' })
  @ApiResponse({ status: 200, description: 'User preferences updated' })
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    const updated = await this.usersService.updatePreferences(user.id, dto);
    return {
      user: updated,
      themePreference: updated.themePreference,
    };
  }
}
