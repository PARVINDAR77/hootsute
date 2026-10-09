import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    isHealthy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLiveness', () => {
    it('should return status ok and node process uptime', () => {
      const result = service.getLiveness();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('nodeVersion');
    });
  });

  describe('getReadiness', () => {
    it('should return ready status when database is healthy', async () => {
      mockPrismaService.isHealthy.mockResolvedValue(true);
      const result = await service.getReadiness();
      expect(result).toHaveProperty('status', 'ready');
      expect(result).toHaveProperty('database', 'connected');
    });

    it('should throw ServiceUnavailableException when database is unhealthy', async () => {
      mockPrismaService.isHealthy.mockResolvedValue(false);
      await expect(service.getReadiness()).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
