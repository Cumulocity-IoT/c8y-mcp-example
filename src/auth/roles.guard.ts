import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALL_ROLES_KEY, ANY_ROLES_KEY, Role } from './roles.decorator';
import { IUser, UserService } from '@c8y/client';

@Injectable()
export class RolesGuard implements CanActivate {
  protected readonly logger: Logger;

  constructor(private reflector: Reflector) {
    this.logger = new Logger(`${RolesGuard.name}`);
  }

  canActivate(context: ExecutionContext): boolean {
    const allRequiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ALL_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const anyRequiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ANY_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const { currentUser } = context
      .switchToHttp()
      .getRequest<Express.Request>();

    const dummyUserService = new UserService({} as any);

    this.logger.debug(
      `Checking roles for user: "${currentUser?.id}", allRequiredRoles: ${JSON.stringify(allRequiredRoles)}, anyRequiredRoles: ${JSON.stringify(anyRequiredRoles)}`,
    );

    if (
      allRequiredRoles?.length &&
      !dummyUserService.hasAllRoles(currentUser as IUser, allRequiredRoles)
    ) {
      return false;
    }

    if (
      anyRequiredRoles?.length &&
      !dummyUserService.hasAnyRole(currentUser as IUser, anyRequiredRoles)
    ) {
      return false;
    }

    return true;
  }
}
