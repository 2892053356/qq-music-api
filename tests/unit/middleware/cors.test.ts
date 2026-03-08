import { Context } from 'koa';
import corsMiddleware from '../../../middlewares/corsMiddleware';

describe('middlewares/cors', () => {
  let ctx: Context;
  let next: jest.Mock;

  beforeEach(() => {
    ctx = {
      set: jest.fn(),
      request: {
        header: {}
      },
      method: 'GET',
      status: 200
    } as any;
    next = jest.fn().mockResolvedValue(undefined);
  });

  it('应设置基础 CORS 头', async () => {
    const middleware = corsMiddleware();
    await middleware(ctx, next);

    expect(ctx.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(ctx.set).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    expect(ctx.set).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    expect(ctx.set).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
  });

  it('应处理 OPTIONS 预检请求', async () => {
    ctx.method = 'OPTIONS';
    const middleware = corsMiddleware();
    await middleware(ctx, next);

    expect(ctx.status).toBe(204);
    expect(next).not.toHaveBeenCalled();
  });

  it('应调用 next() 处理非 OPTIONS 请求', async () => {
    ctx.method = 'GET';
    const middleware = corsMiddleware();
    await middleware(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(ctx.status).not.toBe(204);
  });

  it('应处理自定义 header', async () => {
    ctx.request.header['access-control-request-headers'] = 'X-Custom-Header';
    const middleware = corsMiddleware();
    await middleware(ctx, next);

    expect(ctx.set).toHaveBeenCalledWith('Access-Control-Allow-Headers', expect.stringContaining('X-Custom-Header'));
  });
});
