import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const authenticatedUser = user as AuthenticatedUser;

    if (!authenticatedUser) {
      throw new ForbiddenException('User context missing');
    }

    // SUPER_ADMIN has access to all roles
    if (authenticatedUser.role === Role.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(authenticatedUser.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions: Role ${authenticatedUser.role} is not permitted for this resource`,
      );
    }

    return true;
  }
}
