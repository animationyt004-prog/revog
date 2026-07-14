import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'NO CURFEW API',
      version: '0.1.0',
      health: '/api/health',
    };
  }
}
