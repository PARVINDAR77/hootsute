import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { OccasionsService } from './occasions.service';
import { QueryOccasionsDto } from './dto/query-occasions.dto';

@ApiTags('Festivals & Occasions')
@Public()
@Controller('occasions')
export class OccasionsController {
  constructor(private readonly occasionsService: OccasionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List curated festival and occasion catalog',
    description: 'Returns active festivals and marketing occasions with cultural contexts and prompt guidance.',
  })
  @SwaggerResponse({ status: 200, description: 'List of festivals returned successfully' })
  async listOccasions(@Query() query: QueryOccasionsDto) {
    const result = await this.occasionsService.listOccasions(query);
    return {
      success: true,
      data: result.items,
      pagination: result.pagination,
    };
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Retrieve festival occasion details by slug',
    description: 'Returns cultural context, prompt guidance, and suggested hashtags for a specific festival.',
  })
  @ApiParam({ name: 'slug', description: 'Unique slug of the festival (e.g. diwali, holi, navratri)' })
  @SwaggerResponse({ status: 200, description: 'Occasion details returned successfully' })
  @SwaggerResponse({ status: 404, description: 'Festival occasion not found' })
  async getOccasionBySlug(@Param('slug') slug: string) {
    const occasion = await this.occasionsService.getOccasionBySlug(slug);
    return {
      success: true,
      data: occasion,
    };
  }
}
