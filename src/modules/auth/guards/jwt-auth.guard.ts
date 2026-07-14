import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Placeholder JWT Authentication Guard.
 * In production, this validates JWT tokens from the Authorization header.
 * For T-001 scope, this guard establishes the auth contract without
 * implementing the full login/registration flow (deferred to T-003).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    // T-001: Accept mock authenticated user for testing tenant isolation.
    // T-003 will replace this with real JWT validation.
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Authentication required');
    }

    // Placeholder: extract user from header for T-001 testing
    // Format: "Bearer mock-<userId>-<tenantId>"
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer' && parts[1].startsWith('mock-')) {
      const [, userId, tenantId] = parts[1].split('-');
      if (userId && tenantId) {
        request.user = { id: userId, tenantId, email: `${userId}@test.com` };
        return true;
      }
    }

    throw new UnauthorizedException('Invalid authentication token');
  }
}
