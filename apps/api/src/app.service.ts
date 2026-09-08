import { Inject, Injectable } from '@nestjs/common';
import { ENV, type Env } from './config/config.module';
import { BullmqService } from './infra/bullmq/bullmq.service';

@Injectable()
export class AppService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly bullmq: BullmqService,
  ) {}

  async getHello(): Promise<string> {
    await this.bullmq.addJob('hello', { message: 'hlw from appservice' });
    return `Server is running on port: ${this.env.API_PORT}`;
  }
}
