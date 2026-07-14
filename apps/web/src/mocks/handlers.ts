import { http, HttpResponse, delay } from 'msw';

const generateId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const generateRequestId = () => 'req_' + Math.random().toString(36).substring(2, 15);

type MockUser = {
  id: string;
  email: string;
  password: string;
  name: string | null;
  created_at: string;
};

type MockWorkspace = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  language: string;
  owner_id: string;
  created_at: string;
};

type MockTicket = {
  id: string;
  workspace_id: string;
  number: string;
  title: string;
  description: string;
  source: 'WEB';
  status: 'NEW' | 'TRIAGE' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  category: string | null;
  requester_id: string;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  reopen_count: number;
};

type MockTicketMessage = {
  id: string;
  ticket_id: string;
  author_id: string;
  visibility: 'PUBLIC' | 'INTERNAL';
  body: string;
  created_at: string;
};

type MockTicketEvent = {
  id: string;
  type: string;
  actor_id: string | null;
  from_value: string | null;
  to_value: string | null;
  created_at: string;
};

function loadMockMap<T>(key: string): Map<string, T> {
  if (typeof localStorage === 'undefined') return new Map();

  try {
    const raw = localStorage.getItem(key);
    return raw ? new Map(JSON.parse(raw) as [string, T][]) : new Map();
  } catch {
    return new Map();
  }
}

function persistMockMap<T>(key: string, map: Map<string, T>) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(Array.from(map.entries())));
}

const users = loadMockMap<MockUser>('msw:users');
const workspaces = loadMockMap<MockWorkspace>('msw:workspaces');
const workspaceMembers = loadMockMap<string[]>('msw:workspaceMembers');
const tickets = loadMockMap<MockTicket>('msw:tickets');
const ticketMessages = loadMockMap<MockTicketMessage[]>('msw:ticketMessages');
const ticketEvents = loadMockMap<MockTicketEvent[]>('msw:ticketEvents');

function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('mock_access_token_', '');
  return users.get(userId) || null;
}

function isWorkspaceMember(workspaceId: string, userId: string) {
  return (workspaceMembers.get(workspaceId) || []).includes(userId);
}

export const handlers = [
  http.post('/api/v1/auth/register', async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as {
      email: string;
      password: string;
      name?: string;
    };

    const existingUser = Array.from(users.values()).find(
      (u) => u.email.toLowerCase() === body.email.toLowerCase(),
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
        { status: 409 },
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
    persistMockMap('msw:users', users);

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
      { status: 201 },
    );
  }),

  http.post('/api/v1/auth/login', async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as {
      email: string;
      password: string;
    };

    const user = Array.from(users.values()).find(
      (u) => u.email.toLowerCase() === body.email.toLowerCase(),
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
        { status: 404 },
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
        { status: 401 },
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
        { status: 401 },
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
        { status: 401 },
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
        { status: 401 },
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
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      name: string;
      slug: string;
      timezone?: string;
      language?: string;
    };

    const existingWorkspace = Array.from(workspaces.values()).find(
      (w) => w.slug.toLowerCase() === body.slug.toLowerCase(),
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
        { status: 409 },
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
    persistMockMap('msw:workspaces', workspaces);
    persistMockMap('msw:workspaceMembers', workspaceMembers);

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
      { status: 201 },
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
        { status: 401 },
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
        { status: 401 },
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

  http.post('/api/v1/workspaces/:workspaceId/tickets', async ({ request, params }) => {
    await delay(300);
    const user = getUserFromRequest(request);
    const workspaceId = params.workspaceId as string;
    if (!user || !isWorkspaceMember(workspaceId, user.id)) {
      return HttpResponse.json(
        {
          error: { code: 'FORBIDDEN', message: 'Workspace access denied' },
          request_id: generateRequestId(),
        },
        { status: user ? 403 : 401 },
      );
    }

    const body = (await request.json()) as {
      title: string;
      description: string;
      priority?: 'P1' | 'P2' | 'P3' | 'P4';
      category?: string;
    };
    const workspaceTickets = Array.from(tickets.values()).filter(
      (ticket) => ticket.workspace_id === workspaceId,
    );
    const now = new Date().toISOString();
    const ticket = {
      id: generateId(),
      workspace_id: workspaceId,
      number: `TCK-${String(workspaceTickets.length + 1).padStart(6, '0')}`,
      title: body.title,
      description: body.description,
      source: 'WEB' as const,
      status: 'NEW' as const,
      priority: body.priority || 'P3',
      category: body.category || null,
      requester_id: user.id,
      assignee_id: null,
      created_at: now,
      updated_at: now,
      resolved_at: null,
      closed_at: null,
      reopen_count: 0,
    };
    tickets.set(ticket.id, ticket);
    ticketMessages.set(ticket.id, []);
    ticketEvents.set(ticket.id, [
      {
        id: generateId(),
        type: 'CREATED',
        actor_id: user.id,
        from_value: null,
        to_value: ticket.number,
        created_at: now,
      },
    ]);
    persistMockMap('msw:tickets', tickets);
    persistMockMap('msw:ticketMessages', ticketMessages);
    persistMockMap('msw:ticketEvents', ticketEvents);

    return HttpResponse.json(
      { data: { ticket }, request_id: generateRequestId() },
      { status: 201 },
    );
  }),

  http.get('/api/v1/workspaces/:workspaceId/tickets', async ({ request, params }) => {
    await delay(200);
    const user = getUserFromRequest(request);
    const workspaceId = params.workspaceId as string;
    if (!user || !isWorkspaceMember(workspaceId, user.id)) {
      return HttpResponse.json(
        {
          error: { code: 'FORBIDDEN', message: 'Workspace access denied' },
          request_id: generateRequestId(),
        },
        { status: user ? 403 : 401 },
      );
    }

    const workspaceTickets = Array.from(tickets.values())
      .filter((ticket) => ticket.workspace_id === workspaceId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return HttpResponse.json({
      data: { tickets: workspaceTickets, page: 1, page_size: 20 },
      request_id: generateRequestId(),
    });
  }),

  http.get('/api/v1/workspaces/:workspaceId/tickets/:ticketId', async ({ request, params }) => {
    await delay(200);
    const user = getUserFromRequest(request);
    const workspaceId = params.workspaceId as string;
    const ticketId = params.ticketId as string;
    if (!user || !isWorkspaceMember(workspaceId, user.id)) {
      return HttpResponse.json(
        {
          error: { code: 'FORBIDDEN', message: 'Workspace access denied' },
          request_id: generateRequestId(),
        },
        { status: user ? 403 : 401 },
      );
    }

    const ticket = tickets.get(ticketId);
    if (!ticket || ticket.workspace_id !== workspaceId) {
      return HttpResponse.json(
        {
          error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' },
          request_id: generateRequestId(),
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      data: {
        ticket,
        messages: ticketMessages.get(ticketId) || [],
        events: ticketEvents.get(ticketId) || [],
      },
      request_id: generateRequestId(),
    });
  }),

  http.post(
    '/api/v1/workspaces/:workspaceId/tickets/:ticketId/messages',
    async ({ request, params }) => {
      await delay(200);
      const user = getUserFromRequest(request);
      const workspaceId = params.workspaceId as string;
      const ticketId = params.ticketId as string;
      if (!user || !isWorkspaceMember(workspaceId, user.id)) {
        return HttpResponse.json(
          {
            error: { code: 'FORBIDDEN', message: 'Workspace access denied' },
            request_id: generateRequestId(),
          },
          { status: user ? 403 : 401 },
        );
      }
      const ticket = tickets.get(ticketId);
      if (!ticket || ticket.workspace_id !== workspaceId) {
        return HttpResponse.json(
          {
            error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' },
            request_id: generateRequestId(),
          },
          { status: 404 },
        );
      }
      const body = (await request.json()) as {
        visibility: 'PUBLIC' | 'INTERNAL';
        body: string;
      };
      const now = new Date().toISOString();
      const message = {
        id: generateId(),
        ticket_id: ticketId,
        author_id: user.id,
        visibility: body.visibility,
        body: body.body,
        created_at: now,
      };
      ticketMessages.set(ticketId, [...(ticketMessages.get(ticketId) || []), message]);
      persistMockMap('msw:ticketMessages', ticketMessages);
      ticketEvents.set(ticketId, [
        ...(ticketEvents.get(ticketId) || []),
        {
          id: generateId(),
          type: 'MESSAGE_ADDED',
          actor_id: user.id,
          from_value: null,
          to_value: body.visibility,
          created_at: now,
        },
      ]);
      persistMockMap('msw:ticketEvents', ticketEvents);
      return HttpResponse.json({ data: { message }, request_id: generateRequestId() });
    },
  ),

  http.post(
    '/api/v1/workspaces/:workspaceId/tickets/:ticketId/status',
    async ({ request, params }) => {
      await delay(200);
      const user = getUserFromRequest(request);
      const workspaceId = params.workspaceId as string;
      const ticketId = params.ticketId as string;
      if (!user || !isWorkspaceMember(workspaceId, user.id)) {
        return HttpResponse.json(
          {
            error: { code: 'FORBIDDEN', message: 'Workspace access denied' },
            request_id: generateRequestId(),
          },
          { status: user ? 403 : 401 },
        );
      }
      const ticket = tickets.get(ticketId);
      if (!ticket || ticket.workspace_id !== workspaceId) {
        return HttpResponse.json(
          {
            error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' },
            request_id: generateRequestId(),
          },
          { status: 404 },
        );
      }
      const body = (await request.json()) as { status: typeof ticket.status; reason?: string };
      const now = new Date().toISOString();
      const updated = {
        ...ticket,
        status: body.status,
        updated_at: now,
        resolved_at: body.status === 'RESOLVED' ? now : ticket.resolved_at,
        closed_at: body.status === 'CLOSED' ? now : ticket.closed_at,
        reopen_count: body.status === 'REOPENED' ? ticket.reopen_count + 1 : ticket.reopen_count,
      };
      tickets.set(ticketId, updated);
      persistMockMap('msw:tickets', tickets);
      ticketEvents.set(ticketId, [
        ...(ticketEvents.get(ticketId) || []),
        {
          id: generateId(),
          type: body.status === 'CLOSED' ? 'CLOSED' : 'STATUS_CHANGED',
          actor_id: user.id,
          from_value: ticket.status,
          to_value: body.status,
          created_at: now,
        },
      ]);
      persistMockMap('msw:ticketEvents', ticketEvents);
      return HttpResponse.json({ data: { ticket: updated }, request_id: generateRequestId() });
    },
  ),
];
