import { Controller, Get } from '@nestjs/common';
import { version } from '../../package.json';

@Controller('health')
export class HealthController {
  @Get()
  healthCheck() {
    return { status: 'UP', version };
  }
}
