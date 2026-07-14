import { RequestIdMiddleware } from '../request-id.middleware';

describe('RequestIdMiddleware', () => {
  it('reuses inbound request id and writes it to the response header', () => {
    const middleware = new RequestIdMiddleware();
    const req: any = { headers: { 'x-request-id': 'req-client-001' } };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBe('req-client-001');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'req-client-001');
    expect(next).toHaveBeenCalled();
  });

  it('generates a request id when none is provided', () => {
    const middleware = new RequestIdMiddleware();
    const req: any = { headers: {} };
    const res = { setHeader: jest.fn() };

    middleware.use(req, res, jest.fn());

    expect(req.requestId).toMatch(/^req_/);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.requestId);
  });
});
