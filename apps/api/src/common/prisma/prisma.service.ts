import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connected to Postgres');
    } catch (err) {
      // Don't crash the whole app if the DB isn't wired yet (e.g. before Neon
      // is connected). Queries will surface their own errors. Fail-fast in prod.
      const message = err instanceof Error ? err.message : String(err);
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      this.logger.warn(`Postgres not connected yet: ${message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
