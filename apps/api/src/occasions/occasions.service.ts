import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryOccasionsDto } from './dto/query-occasions.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OccasionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listOccasions(query: QueryOccasionsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.FestivalOccasionWhereInput = {
      isActive: true,
    };

    if (query.category) {
      where.category = {
        equals: query.category,
        mode: 'insensitive',
      };
    }

    if (query.dateType) {
      where.dateType = {
        equals: query.dateType,
        mode: 'insensitive',
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { culturalContext: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, occasions] = await Promise.all([
      this.prisma.festivalOccasion.count({ where }),
      this.prisma.festivalOccasion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      items: occasions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOccasionBySlug(slug: string) {
    const occasion = await this.prisma.festivalOccasion.findUnique({
      where: { slug: slug.toLowerCase().trim() },
    });

    if (!occasion || !occasion.isActive) {
      throw new NotFoundException(`Festival or occasion with slug '${slug}' not found`);
    }

    return occasion;
  }
}
