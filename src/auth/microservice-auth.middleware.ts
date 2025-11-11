import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { BasicAuth, Client } from '@c8y/client';
import { MicroserviceAuthService } from './microservice-auth.service';
import { ConfigurationService } from '../config/configuration.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      microserviceClient?: Client;
    }
  }
}

@Injectable()
export class MicroserviceAuthMiddleware implements NestMiddleware {
  constructor(private authService: MicroserviceAuthService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    req.microserviceClient = await this.getClientForRequest(req);
    next();
  }

  protected async getClientForRequest(req: Request) {
    const currentTenant = req.currentTenant;
    if (!currentTenant?.name) {
      throw new Error('Current tenant is not set.');
    }
    const subscription = await this.getMicroserviceSubscriptionForTenant(
      currentTenant.name,
    );
    const baseUrl = ConfigurationService.getBaseUrl();
    const client = new Client(new BasicAuth(subscription), baseUrl);
    client.core.tenant = currentTenant.name;
    client.core.defaultHeaders['X-Cumulocity-Application-Key'] =
      ConfigurationService.getApplicationKey();
    return client;
  }

  protected async getMicroserviceSubscriptionForTenant(tenantId: string) {
    const subscriptions = await this.authService.getMicroserviceSubscriptions();
    const subscriptionOfTenant = subscriptions.find(
      (sub) => sub.tenant === tenantId,
    );
    if (!subscriptionOfTenant) {
      throw new HttpException(
        `Microservice is not subscribed to tenant ${tenantId}.`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return subscriptionOfTenant;
  }
}
