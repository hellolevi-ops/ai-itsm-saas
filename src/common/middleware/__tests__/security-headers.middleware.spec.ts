import { SecurityHeadersMiddleware } from '../security-headers.middleware';

describe('SecurityHeadersMiddleware', () => {
  it('adds baseline browser security headers', () => {
    const middleware = new SecurityHeadersMiddleware();
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use({}, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    expect(next).toHaveBeenCalled();
  });
});
