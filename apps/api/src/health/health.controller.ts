import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Liveness — cheap, no external deps. Used by Railway/Vercel health checks.
  @Get()
  live() {
    return {
      status: 'ok',
      service: 'revog-api',
      time: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    };
  }

  // Readiness — verifies the database is reachable.
  @Get('db')
  async db() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { status: 'error', database: 'unreachable', detail: message };
    }
  }
}
