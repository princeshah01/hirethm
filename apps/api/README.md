# api

NestJS API service. This doc covers the app-wide infrastructure — config/env, database (Drizzle), and Redis — and how to use them from a new feature module.

## Config / Env

Environment variables are validated and typed in `src/config/env.ts` via `@repo/env`. `ConfigModule` (`src/config/config.module.ts`) is `@Global()`, so it's already available everywhere — you don't need to import it into your feature module.

Inject it with the `ENV` token:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { ENV, type Env } from '../config/config.module';

@Injectable()
export class SomeService {
  constructor(@Inject(ENV) private readonly env: Env) {}

  someMethod() {
    return this.env.API_PORT;
  }
}
```

To add a new env var, declare it in `src/config/env.ts` using the `@repo/env/schema` helpers (`string`, `port`, `secret`, `url`, etc.) — it becomes available on `Env` automatically.

## Database (Drizzle + Postgres)

`DatabaseModule` (`src/database/database.module.ts`) is `@Global()` and already imported in `AppModule`, so it's available in any feature module without re-importing it.

Inject `DatabaseService` and use its `db` property to run queries:

```ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  findAll() {
    return this.database.db.query.users.findMany();
  }
}
```

`DatabaseService` verifies connectivity on app startup (`onModuleInit`) and closes the pool on shutdown (`onModuleDestroy`) — if the DB is unreachable, the app fails to start rather than starting silently.

**Schema**: table definitions live in `src/database/schema/`. Export every table from `src/database/schema/index.ts` so it's picked up by both Drizzle Studio and `DatabaseService`.

**Scripts** (run from `apps/api`, or `pnpm --filter api <script>` from the repo root):

```bash
pnpm db:generate   # generate a migration from schema changes
pnpm db:migrate    # apply pending migrations
pnpm db:push       # push schema directly to the DB (skips migrations, dev only)
pnpm db:studio     # launch Drizzle Studio
```

## Redis

`RedisModule` (`src/infra/redis/redis.module.ts`) is `@Global()` and already imported in `AppModule`.

Inject `RedisService` and use its `client` property:

```ts
import { Injectable } from '@nestjs/common';
import { RedisService } from '../infra/redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  async get(key: string) {
    return this.redis.client.get(key);
  }
}
```

Like the database, `RedisService` connects and pings Redis on startup and quits the client on shutdown — connection failures at boot crash the app instead of failing silently later.

## Adding a new feature module

Because `ConfigModule`, `DatabaseModule`, and `RedisModule` are all `@Global()`, a new feature module doesn't need to import any of them — just inject `ENV`, `DatabaseService`, or `RedisService` directly into your service's constructor.
