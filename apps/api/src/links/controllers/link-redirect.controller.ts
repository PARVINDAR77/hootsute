import { Controller, Get, Param, Req, Res, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { LinksService } from '../services/links.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public Link Redirect')
@Public()
@Controller('links')
export class LinkRedirectController {
  constructor(private readonly linksService: LinksService) {}

  @Get('r/:code')
  @ApiOperation({ summary: 'Public short URL redirect with click telemetry tracking' })
  @ApiParam({ name: 'code', description: 'Unique short slug' })
  async handleShortRedirect(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

    const userAgent = req.get('user-agent') || undefined;
    const referrer = req.get('referer') || req.get('referrer') || undefined;
    const countryCode = req.get('cf-ipcountry') || undefined;

    const destinationUrl = await this.linksService.resolveAndRecordClick(code, {
      ip: clientIp,
      userAgent,
      referrer,
      countryCode,
    });

    return res.redirect(302, destinationUrl);
  }

  @Get('l/:code')
  @ApiOperation({ summary: 'Alternative short URL redirect endpoint' })
  @ApiParam({ name: 'code', description: 'Unique short slug' })
  async handleShortRedirectAlias(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.handleShortRedirect(code, req, res);
  }
}
