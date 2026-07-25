import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

// The code the welcome popup rewards. Kept in sync with the promo ticker.
const WELCOME_CODE = 'REVOG10';

/** Captures welcome-popup / newsletter signups and hands back the reward code. */
@Injectable()
export class SubscribeService {
  private readonly logger = new Logger(SubscribeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async subscribe(
    rawEmail: string,
    phone: string | undefined,
    ip: string,
  ): Promise<{ code: string }> {
    const email = rawEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new BadRequestException('Enter a valid email address.');
    }

    const ok = await this.redis.rateLimit(`sub:rl:ip:${ip}`, 10, 60);
    if (!ok) throw new BadRequestException('Too many attempts. Try again in a minute.');

    const cleanPhone = phone?.replace(/\D/g, '').slice(-10);
    await this.prisma.subscriber.upsert({
      where: { email },
      update: cleanPhone ? { phone: cleanPhone } : {},
      create: {
        email,
        phone: cleanPhone || null,
        source: 'welcome-popup',
      },
    });

    // Reward code is public — it just surfaces the existing promo coupon.
    return { code: WELCOME_CODE };
  }
}
