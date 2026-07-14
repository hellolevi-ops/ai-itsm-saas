import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: '未认证或令牌无效',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: '未认证或令牌无效',
      });
    }

    // The JWT validation is handled by PassportStrategy
    // Here we just check if user is attached to request
    if (!request.user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: '未认证或令牌无效',
      });
    }

    return true;
  }
}
