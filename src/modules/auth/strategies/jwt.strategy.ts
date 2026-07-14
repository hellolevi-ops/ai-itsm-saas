import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { getRequiredEnv } from '@/config/env';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getRequiredEnv('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; tenantId: string }) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      return null;
    }
    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
    };
  }
}
