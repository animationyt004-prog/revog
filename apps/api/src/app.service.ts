import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'REVOG API',
      version: '0.1.0',
      health: '/api/health',
    };
  }
}
