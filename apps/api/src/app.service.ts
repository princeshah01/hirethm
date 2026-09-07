import { Inject, Injectable } from '@nestjs/common';
import { ENV, type Env } from './config/config.module';

@Injectable()
export class AppService {
  constructor(@Inject(ENV) private readonly env: Env) {}

  getHello(): string {
    return `Server is running on port: ${this.env.API_PORT}`;
  }
}
