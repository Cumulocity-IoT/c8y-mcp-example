import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  Client,
  ICurrentTenant,
  ICurrentUser,
  MicroserviceClientRequestAuth,
} from '@c8y/client';
import { ConfigurationService } from '../config/configuration.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: ICurrentUser;
      currentTenant?: ICurrentTenant;
      userClient?: Client;
    }
  }
}

@Injectable()
export class UserAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(UserAuthMiddleware.name);

  async use(req: Request, res: Response, next: NextFunction) {
    const baseUrl = ConfigurationService.getBaseUrl();
    const client = new Client(
      new MicroserviceClientRequestAuth(req.headers),
      baseUrl,
    );
    client.core.defaultHeaders['X-Cumulocity-Application-Key'] =
      ConfigurationService.getApplicationKey();
    try {
      /**
       * currentWithEffectiveRoles -> Important to use, as otherwise the call
       * from a webhook does not succeed as `current()`-call does not work with microservice
       * credentials.
       */
      const { data: user } = await client.user.currentWithEffectiveRoles();
      const { data: tenant } = await client.tenant.current();
      client.core.tenant = tenant.name;
      req.currentUser = user;
      req.currentTenant = tenant;
      req.userClient = client;

      this.logger.debug(
        `Request received from user: "${user.id}" on tenant: "${tenant.name}" on path: ${req.method} - "${req.path}"`,
      );
    } catch (ex) {
      this.logger.warn(
        `An error occurred while fetching user details on incoming request on path: ${req.method} - "${req.path}"`,
        ex,
      );
      if (ex?.res?.status) {
        throw new HttpException(ex.data, ex.res.status);
      }
      throw new HttpException(ex, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    next();
  }
}
