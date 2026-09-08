import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { env } from './config/env';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): Promise<string> {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      env: env,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
