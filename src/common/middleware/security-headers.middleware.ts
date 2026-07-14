import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(_req: any, res: any, next: () => void) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  }
}
