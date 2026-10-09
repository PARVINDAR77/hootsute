import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are required on route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: Role.BUSINESS_MEMBER });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow SUPER_ADMIN access to any role-protected resource', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.BUSINESS_OWNER]);
    const context = createMockContext({
      id: '1',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow user who has the exact required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.BUSINESS_OWNER]);
    const context = createMockContext({
      id: '2',
      role: Role.BUSINESS_OWNER,
      status: UserStatus.ACTIVE,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.BUSINESS_OWNER]);
    const context = createMockContext({
      id: '3',
      role: Role.BUSINESS_MEMBER,
      status: UserStatus.ACTIVE,
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
