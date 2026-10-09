import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions(customPath?: string) {
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';
    const domain = this.configService.get<string>('cookie.domain');
    const isLocalhost = !domain || domain === 'localhost' || domain === '127.0.0.1';

    const options: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: customPath || '/',
    };

    if (!isLocalhost && isProduction && domain) {
      options.domain = domain;
    }

    return options;
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    // Refresh token cookie (7 days) scoped to /api/v1/auth
    res.cookie('refreshToken', refreshToken, {
      ...this.getCookieOptions('/api/v1/auth'),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Access token cookie (15 mins) for SSR / browser requests
    res.cookie('accessToken', accessToken, {
      ...this.getCookieOptions('/'),
      maxAge: 15 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('refreshToken', this.getCookieOptions('/api/v1/auth'));
    res.clearCookie('accessToken', this.getCookieOptions('/'));
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new business owner account' })
  @ApiResponse({ status: 201, description: 'Account successfully registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return {
      message: 'Account registered successfully. You may now log in.',
      user,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and issue access/refresh tokens' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account suspended' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.get('user-agent') || '';

    const result = await this.authService.login(dto, ipAddress, userAgent);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // If client is a non-browser client explicitly requesting tokens in body via header
    const isExplicitApiConsumer = req.headers['x-client-type'] === 'mobile' || req.headers['x-client-type'] === 'cli';

    return {
      user: result.user,
      accessToken: result.accessToken,
      ...(isExplicitApiConsumer ? { refreshToken: result.refreshToken } : {}),
      tokenType: 'Bearer',
      expiresIn: result.expiresIn,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate access and refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully' })
  @ApiResponse({ status: 401, description: 'Refresh token invalid, expired, or reused' })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto?.refreshToken || req.cookies?.['refreshToken'];
    if (!token) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.get('user-agent') || '';

    const result = await this.authService.refresh(token, ipAddress, userAgent);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    const isExplicitApiConsumer = req.headers['x-client-type'] === 'mobile' || req.headers['x-client-type'] === 'cli' || !!dto?.refreshToken;

    return {
      user: result.user,
      accessToken: result.accessToken,
      ...(isExplicitApiConsumer ? { refreshToken: result.refreshToken } : {}),
      tokenType: 'Bearer',
      expiresIn: result.expiresIn,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke active refresh session and clear cookies' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refreshToken'];
    await this.authService.logout(user.id, refreshToken);
    this.clearAuthCookies(res);
    return { success: true, message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all active sessions for current user' })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logoutAll(user.id);
    this.clearAuthCookies(res);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const userProfile = await this.authService.getMe(user.id);
    return userProfile;
  }
}
