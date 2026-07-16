import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('R2_BUCKET') ?? '';
    this.publicUrl = (config.get<string>('R2_PUBLIC_URL') ?? '').replace(/\/$/, '');
    const endpoint = config.get<string>('R2_ENDPOINT');
    const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY');

    this.client =
      endpoint && accessKeyId && secretAccessKey && this.bucket
        ? new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } })
        : null;
    if (!this.client) this.logger.warn('R2 not configured — uploads disabled');
  }

  get configured(): boolean {
    return this.client !== null && !!this.publicUrl;
  }

  /** Store one image under products/<slugOrRandom>/ and return its public URL. */
  async uploadImage(
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
    folder: string,
  ): Promise<string> {
    if (!this.client || !this.publicUrl) {
      throw new BadRequestException('Image storage is not configured.');
    }
    if (!ALLOWED.has(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, WebP or AVIF images are allowed.');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Image must be under 8 MB.');
    }

    const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const safeFolder = folder.replace(/[^a-z0-9-]/gi, '').slice(0, 60) || 'misc';
    const key = `products/${safeFolder}/${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return `${this.publicUrl}/${key}`;
  }
}
