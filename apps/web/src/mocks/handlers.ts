import { http, HttpResponse, delay } from 'msw';

const generateId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const generateRequestId = () => 'req_' + Math.random().toString(36).substring(2, 15);

const users = new Map<string, { id: string; email: string; password: string; name: string | null; created_at: string }>();
const workspaces = new Map<string, { id: string; name: string; slug: string; timezone: string; language: string; owner_id: string; created_at: string }>();
const workspaceMembers = new Map<string, string[]>();

export const handlers = [
  http.post('/api/v1/auth/register', async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as {
      email: string;
      password: string;
      name?: string;
    };

    const existingUser = Array.from(users.values()).find(
      (u) => u.email.toLowerCase() === body.email.toLowerCase()
    );

    if (existingUser) {
      return HttpResponse.json(
        {
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: '该邮箱已被注册',
            details: { email: body.email },
          },
          request_id: generateRequestId(),
        },
        { status: 409 }
      );
    }

    const userId = generateId();
    const now = new Date().toISOString();
    const user = {
      id: userId,
      email: body.email,
      password: body.password,
      name: body.name || null,
      created_at: now,
    };
    users.set(userId, user);

    return HttpResponse.json(
      {
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at,
          },
          token: {
            access_token: 'mock_access_token_' + userId,
            refresh_token: 'mock_refresh_token_' + userId,
            expires_in: 3600,
          },
        },
        request_id: generateRequestId(),
      },
      { status: 201 }
    );
  }),

  http.post('/api/v1/auth/login', async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as {
      email: string;
      password: string;
    };

    const user = Array.from(users.values()).find(
      (u) => u.email.toLowerCase() === body.email.toLowerCase()
    );

    if (!user) {
      return HttpResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            details: { email: body.email },
          },
          request_id: generateRequestId(),
        },
        { status: 404 }
      );
    }

    if (user.password !== body.password) {
      return HttpResponse.json(
        {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '邮箱或密码错误',
          },
          request_id: generateRequestId(),
        },
        { status: 401 }
      );
    }

    const userWorkspaces = Array.from(workspaces.values())
      .filter((w) => {
        const members = workspaceMembers.get(w.id) || [];
        return members.includes(user.id);
      })
      .map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        role: w.owner_id === user.id ? 'owner' : 'member',
      }));

    return HttpResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        token: {
          access_token: 'mock_access_token_' + user.id,
          refresh_token: 'mock_refresh_token_' + user.id,
          expires_in: 3600,
        },
        workspaces: userWorkspaces,
      },
      request_id: generateRequestId(),
    });
  }),

  http.get('/api/v1/auth/me', async ({ request }) => {
    await delay(200);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '未登录',
          },
          request_id: generateRequestId(),
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = token.replace('mock_access_token_', '');
    const user = users.get(userId);

    if (!user) {
      return HttpResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '令牌无效',
          },
          request_id: generateRequestId(),
        },
        { status: 401 }
      );
    }

    const userWorkspaces = Array.from(workspaces.values())
      .filter((w) => {
        const members = workspaceMembers.get(w.id) || [];
        return members.includes(user.id);
      })
      .map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        role: w.owner_id === user.id ? 'owner' : 'member',
      }));

    return HttpResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        workspaces: userWorkspaces,
      },
      request_id: generateRequestId(),
    });
  }),

  http.post('/api/v1/workspaces', async ({ request }) => {
    await delay(500);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '未登录',
          },
          request_id: generateRequestId(),
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = token.replace('mock_access_token_', '');
    const user = users.get(userId);

    if (!user) {
      return HttpResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '令牌无效',
          },
          request_id: generateRequestId(),
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      name: string;
      slug: string;
      timezone?: string;
      language?: string;
    };

    const existingWorkspace = Array.from(workspaces.values()).find(
      (w) => w.slug.toLowerCase() === body.slug.toLowerCase()
    );

    if (existingWorkspace) {
      return HttpResponse.json(
        {
          error: {
            code: 'SLUG_ALREADY_EXISTS',
            message: '该工作区简称已被占用',
            details: { slug: body.slug },
          },
          request_id: generateRequestId(),
        },
        { status: 409 }
      );
    }

    const workspaceId = generateId();
    const now = new Date().toISOString();
    const workspace = {
      id: workspaceId,
      name: body.name,
      slug: body.slug,
      timezone: body.timezone || 'Asia/Shanghai',
      language: body.language || 'zh-CN',
      owner_id: user.id,
      created_at: now,
    };
    workspaces.set(workspaceId, workspace);
    workspaceMembers.set(workspaceId, [user.id]);

    return HttpResponse.json(
      {
        data: {
          workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            timezone: workspace.timezone,
            language: workspace.language,
            role: 'owner',
            created_at: workspace.created_at,
          },
        },
        request_id: generateRequestId(),
      },
      { status: 201 }
    );
  }),

  http.get('/api/v1/workspaces', async ({ request }) => {
    await delay(200);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '未登录',
          },
          request_id: generateRequestId(),
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = token.replace('mock_access_token_', '');
    const user = users.get(userId);

    if (!user) {
      return HttpResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '令牌无效',
          },
          request_id: generateRequestId(),
        },
        { status: 401 }
      );
    }

    const userWorkspaces = Array.from(workspaces.values())
      .filter((w) => {
        const members = workspaceMembers.get(w.id) || [];
        return members.includes(user.id);
      })
      .map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        timezone: w.timezone,
        language: w.language,
        role: w.owner_id === user.id ? 'owner' : 'member',
        created_at: w.created_at,
      }));

    return HttpResponse.json({
      data: {
        workspaces: userWorkspaces,
      },
      request_id: generateRequestId(),
    });
  }),
];
