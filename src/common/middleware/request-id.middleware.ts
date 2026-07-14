import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const inbound = req.headers?.['x-request-id'];
    const requestId = Array.isArray(inbound) ? inbound[0] : inbound || `req_${randomUUID()}`;
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
