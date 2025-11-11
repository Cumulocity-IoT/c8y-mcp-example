import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import { MicroserviceAuthMiddleware } from './auth/microservice-auth.middleware';
import { MicroserviceAuthService } from './auth/microservice-auth.service';
import { UserAuthMiddleware } from './auth/user-auth.middleware';
import { HealthModule } from './health/health.module';
import { C8yMcpModule } from './tools/mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.development.env', '.env'],
    }),
    C8yMcpModule,
    PrometheusModule.register({
      path: 'prometheus',
    }),
    AppModule,
    HealthModule,
  ],
  providers: [MicroserviceAuthService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        // Order matters
        UserAuthMiddleware,
        MicroserviceAuthMiddleware,
      )
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'health', method: RequestMethod.HEAD },
        { path: 'prometheus', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
