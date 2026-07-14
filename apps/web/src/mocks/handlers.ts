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
  source: 'WEB' | 'WECOM';
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
  service_catalog_item_id: string | null;
  request_template_id: string | null;
  response_due_at: string | null;
  resolution_due_at: string | null;
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

type MockKnowledgeArticle = {
  id: string;
  workspace_id: string;
  source_ticket_id: string | null;
  source_type: 'TICKET' | 'MANUAL';
  title: string;
  problem: string;
  resolution: string;
  verification: string;
  rollback: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'INTERNAL' | 'REQUESTER';
  created_by_id: string;
  published_by_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type MockServiceCatalogItem = {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  category: string | null;
  default_priority: 'P1' | 'P2' | 'P3' | 'P4';
  response_target_minutes: number;
  resolution_target_minutes: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
};

type MockRequestTemplate = {
  id: string;
  workspace_id: string;
  service_catalog_item_id: string;
  name: string;
  description: string | null;
  default_title: string;
  default_description: string;
  default_priority: 'P1' | 'P2' | 'P3' | 'P4';
  default_category: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
};

type MockChannelConnection = {
  id: string;
  workspace_id: string;
  type: 'WECOM';
  name: string;
  token: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_by_id: string;
  created_at: string;
  updated_at: string;
};

type MockChannelInboundMessage = {
  id: string;
  workspace_id: string;
  connection_id: string;
  ticket_id: string | null;
  external_message_id: string;
  external_user_id: string;
  external_user_name: string | null;
  subject: string;
  body: string;
  status: 'RECEIVED' | 'TICKET_CREATED' | 'DUPLICATE' | 'REJECTED';
  received_at: string;
};

type MockWorkspaceInvitation = {
  id: string;
  workspace_id: string;
  email: string | null;
  role_type: 'AGENT' | 'REQUESTER';
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  invited_by_id: string;
  accepted_by_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
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
const knowledgeArticles = loadMockMap<MockKnowledgeArticle>('msw:knowledgeArticles');
const serviceCatalogItems = loadMockMap<MockServiceCatalogItem>('msw:serviceCatalogItems');
const requestTemplates = loadMockMap<MockRequestTemplate>('msw:requestTemplates');
const channelConnections = loadMockMap<MockChannelConnection>('msw:channelConnections');
const channelInboundMessages = loadMockMap<MockChannelInboundMessage>('msw:channelInboundMessages');
const workspaceInvitations = loadMockMap<MockWorkspaceInvitation>('msw:workspaceInvitations');

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

function safeInvitation(invitation: MockWorkspaceInvitation) {
  return {
    id: invitation.id,
    workspace_id: invitation.workspace_id,
    email: invitation.email,
    role_type: invitation.role_type,
    status: invitation.status,
    invited_by_id: invitation.invited_by_id,
    accepted_by_id: invitation.accepted_by_id,
    expires_at: invitation.expires_at,
    accepted_at: invitation.accepted_at,
    created_at: invitation.created_at,
    updated_at: invitation.updated_at,
  };
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
      request_template_id?: string;
    };
    const template = body.request_template_id
      ? requestTemplates.get(body.request_template_id)
      : null;
    const serviceItem =
      template && template.workspace_id === workspaceId
        ? serviceCatalogItems.get(template.service_catalog_item_id)
        : null;
    if (
      body.request_template_id &&
      (!template || !serviceItem || serviceItem.workspace_id !== workspaceId)
    ) {
      return HttpResponse.json(
        {
          error: { code: 'REQUEST_TEMPLATE_NOT_FOUND', message: 'Request template not found' },
          request_id: generateRequestId(),
        },
        { status: 404 },
      );
    }
    const workspaceTickets = Array.from(tickets.values()).filter(
      (ticket) => ticket.workspace_id === workspaceId,
    );
    const now = new Date().toISOString();
    const nowTime = Date.now();
    const ticket = {
      id: generateId(),
      workspace_id: workspaceId,
      number: `TCK-${String(workspaceTickets.length + 1).padStart(6, '0')}`,
      title: body.title,
      description: body.description,
      source: 'WEB' as const,
      status: 'NEW' as const,
      priority: body.priority || template?.default_priority || 'P3',
      category: body.category || template?.default_category || null,
      requester_id: user.id,
      assignee_id: null,
      created_at: now,
      updated_at: now,
      resolved_at: null,
      closed_at: null,
      reopen_count: 0,
      service_catalog_item_id: serviceItem?.id || null,
      request_template_id: template?.id || null,
      response_due_at: serviceItem
        ? new Date(nowTime + serviceItem.response_target_minutes * 60_000).toISOString()
        : null,
      resolution_due_at: serviceItem
        ? new Date(nowTime + serviceItem.resolution_target_minutes * 60_000).toISOString()
        : null,
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

  http.get('/api/v1/workspaces/:workspaceId/service-catalog', async ({ request, params }) => {
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

    const items = Array.from(serviceCatalogItems.values())
      .filter((item) => item.workspace_id === workspaceId && item.status === 'ACTIVE')
      .sort((a, b) => a.name.localeCompare(b.name));
    const templates = Array.from(requestTemplates.values())
      .filter((template) => template.workspace_id === workspaceId && template.status === 'ACTIVE')
      .map((template) => ({
        ...template,
        service_catalog_item: serviceCatalogItems.get(template.service_catalog_item_id)!,
      }))
      .filter((template) => template.service_catalog_item?.status === 'ACTIVE')
      .sort((a, b) => a.name.localeCompare(b.name));

    return HttpResponse.json({
      data: {
        service_catalog_items: items,
        request_templates: templates,
      },
      request_id: generateRequestId(),
    });
  }),

  http.post(
    '/api/v1/workspaces/:workspaceId/service-catalog/items',
    async ({ request, params }) => {
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
      const body = (await request.json()) as {
        name: string;
        description: string;
        category?: string;
        default_priority?: 'P1' | 'P2' | 'P3' | 'P4';
        response_target_minutes?: number;
        resolution_target_minutes?: number;
      };
      const now = new Date().toISOString();
      const item = {
        id: generateId(),
        workspace_id: workspaceId,
        name: body.name,
        description: body.description,
        category: body.category || null,
        default_priority: body.default_priority || 'P3',
        response_target_minutes: body.response_target_minutes || 240,
        resolution_target_minutes: body.resolution_target_minutes || 1440,
        status: 'ACTIVE' as const,
        created_at: now,
        updated_at: now,
      };
      serviceCatalogItems.set(item.id, item);
      persistMockMap('msw:serviceCatalogItems', serviceCatalogItems);

      return HttpResponse.json(
        {
          data: { service_catalog_item: item },
          request_id: generateRequestId(),
        },
        { status: 201 },
      );
    },
  ),

  http.post(
    '/api/v1/workspaces/:workspaceId/service-catalog/templates',
    async ({ request, params }) => {
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
      const body = (await request.json()) as {
        service_catalog_item_id: string;
        name: string;
        description?: string;
        default_title: string;
        default_description: string;
        default_priority?: 'P1' | 'P2' | 'P3' | 'P4';
        default_category?: string;
      };
      const item = serviceCatalogItems.get(body.service_catalog_item_id);
      if (!item || item.workspace_id !== workspaceId || item.status !== 'ACTIVE') {
        return HttpResponse.json(
          {
            error: { code: 'SERVICE_NOT_FOUND', message: 'Service catalog item not found' },
            request_id: generateRequestId(),
          },
          { status: 404 },
        );
      }

      const now = new Date().toISOString();
      const template = {
        id: generateId(),
        workspace_id: workspaceId,
        service_catalog_item_id: item.id,
        name: body.name,
        description: body.description || null,
        default_title: body.default_title,
        default_description: body.default_description,
        default_priority: body.default_priority || item.default_priority,
        default_category: body.default_category || item.category,
        status: 'ACTIVE' as const,
        created_at: now,
        updated_at: now,
      };
      requestTemplates.set(template.id, template);
      persistMockMap('msw:requestTemplates', requestTemplates);

      return HttpResponse.json(
        {
          data: { request_template: { ...template, service_catalog_item: item } },
          request_id: generateRequestId(),
        },
        { status: 201 },
      );
    },
  ),

  http.get('/api/v1/workspaces/:workspaceId/invitations', async ({ request, params }) => {
    await delay(150);
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

    const invitations = Array.from(workspaceInvitations.values())
      .filter((invitation) => invitation.workspace_id === workspaceId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(safeInvitation);

    return HttpResponse.json({
      data: { invitations },
      request_id: generateRequestId(),
    });
  }),

  http.post('/api/v1/workspaces/:workspaceId/invitations', async ({ request, params }) => {
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

    const body = (await request.json()) as {
      email?: string;
      role_type?: 'AGENT' | 'REQUESTER';
    };
    const now = new Date().toISOString();
    const token = `invite-${generateId()}-${generateId()}`;
    const invitation = {
      id: generateId(),
      workspace_id: workspaceId,
      email: body.email?.toLowerCase() || null,
      role_type: body.role_type || 'REQUESTER',
      token,
      status: 'PENDING' as const,
      invited_by_id: user.id,
      accepted_by_id: null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      accepted_at: null,
      created_at: now,
      updated_at: now,
    };
    workspaceInvitations.set(invitation.id, invitation);
    persistMockMap('msw:workspaceInvitations', workspaceInvitations);

    return HttpResponse.json(
      {
        data: { invitation: safeInvitation(invitation), token },
        request_id: generateRequestId(),
      },
      { status: 201 },
    );
  }),

  http.post('/api/v1/invitations/accept', async ({ request }) => {
    await delay(250);
    const body = (await request.json()) as {
      token: string;
      email: string;
      password: string;
      name?: string;
    };
    const invitation = Array.from(workspaceInvitations.values()).find(
      (candidate) => candidate.token === body.token,
    );
    if (!invitation) {
      return HttpResponse.json(
        {
          error: { code: 'INVITATION_NOT_FOUND', message: 'Invitation not found' },
          request_id: generateRequestId(),
        },
        { status: 404 },
      );
    }
    if (invitation.status !== 'PENDING') {
      return HttpResponse.json(
        {
          error: { code: 'INVITATION_NOT_PENDING', message: 'Invitation is not pending' },
          request_id: generateRequestId(),
        },
        { status: 409 },
      );
    }
    if (invitation.email && invitation.email !== body.email.toLowerCase()) {
      return HttpResponse.json(
        {
          error: { code: 'INVITATION_EMAIL_MISMATCH', message: 'Invitation email does not match' },
          request_id: generateRequestId(),
        },
        { status: 403 },
      );
    }

    const workspace = workspaces.get(invitation.workspace_id);
    if (!workspace) {
      return HttpResponse.json(
        {
          error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
          request_id: generateRequestId(),
        },
        { status: 404 },
      );
    }
    const existingUser = Array.from(users.values()).find(
      (candidate) => candidate.email.toLowerCase() === body.email.toLowerCase(),
    );
    if (existingUser) {
      return HttpResponse.json(
        {
          error: { code: 'EMAIL_ALREADY_EXISTS', message: 'Email already exists' },
          request_id: generateRequestId(),
        },
        { status: 409 },
      );
    }
    const now = new Date().toISOString();
    const user = {
      id: generateId(),
      email: body.email.toLowerCase(),
      password: body.password,
      name: body.name || null,
      created_at: now,
    };
    users.set(user.id, user);
    workspaceMembers.set(invitation.workspace_id, [
      ...(workspaceMembers.get(invitation.workspace_id) || []),
      user.id,
    ]);
    const acceptedInvitation = {
      ...invitation,
      status: 'ACCEPTED' as const,
      accepted_by_id: user.id,
      accepted_at: now,
      updated_at: now,
    };
    workspaceInvitations.set(invitation.id, acceptedInvitation);
    persistMockMap('msw:users', users);
    persistMockMap('msw:workspaceMembers', workspaceMembers);
    persistMockMap('msw:workspaceInvitations', workspaceInvitations);

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
            access_token: `mock_access_token_${user.id}`,
            refresh_token: `mock_refresh_token_${user.id}`,
            expires_in: 3600,
          },
          workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            timezone: workspace.timezone,
            language: workspace.language,
            role: invitation.role_type.toLowerCase(),
            created_at: workspace.created_at,
          },
          invitation: safeInvitation(acceptedInvitation),
        },
        request_id: generateRequestId(),
      },
      { status: 201 },
    );
  }),

  http.get('/api/v1/workspaces/:workspaceId/channels', async ({ request, params }) => {
    await delay(150);
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

    const channels = Array.from(channelConnections.values())
      .filter((channel) => channel.workspace_id === workspaceId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((channel) => ({
        id: channel.id,
        workspace_id: channel.workspace_id,
        type: channel.type,
        name: channel.name,
        status: channel.status,
        created_by_id: channel.created_by_id,
        created_at: channel.created_at,
        updated_at: channel.updated_at,
      }));

    return HttpResponse.json({
      data: { channels },
      request_id: generateRequestId(),
    });
  }),

  http.post('/api/v1/workspaces/:workspaceId/channels/wecom', async ({ request, params }) => {
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

    const body = (await request.json()) as { name: string; token: string };
    const now = new Date().toISOString();
    const channel = {
      id: generateId(),
      workspace_id: workspaceId,
      type: 'WECOM' as const,
      name: body.name,
      token: body.token,
      status: 'ACTIVE' as const,
      created_by_id: user.id,
      created_at: now,
      updated_at: now,
    };
    channelConnections.set(channel.id, channel);
    persistMockMap('msw:channelConnections', channelConnections);
    const safeChannel = {
      id: channel.id,
      workspace_id: channel.workspace_id,
      type: channel.type,
      name: channel.name,
      status: channel.status,
      created_by_id: channel.created_by_id,
      created_at: channel.created_at,
      updated_at: channel.updated_at,
    };

    return HttpResponse.json(
      {
        data: { channel: safeChannel },
        request_id: generateRequestId(),
      },
      { status: 201 },
    );
  }),

  http.post('/api/v1/channels/wecom/:connectionId/messages', async ({ request, params }) => {
    await delay(200);
    const connectionId = params.connectionId as string;
    const channel = channelConnections.get(connectionId);
    const token = request.headers.get('x-channel-token');
    if (!channel || channel.status !== 'ACTIVE') {
      return HttpResponse.json(
        {
          error: { code: 'CHANNEL_NOT_FOUND', message: 'Channel connection not found' },
          request_id: generateRequestId(),
        },
        { status: 404 },
      );
    }
    if (!token || token !== channel.token) {
      return HttpResponse.json(
        {
          error: { code: 'INVALID_CHANNEL_TOKEN', message: 'Invalid channel token' },
          request_id: generateRequestId(),
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      external_message_id: string;
      external_user_id: string;
      external_user_name?: string;
      subject?: string;
      text: string;
    };
    const existing = Array.from(channelInboundMessages.values()).find(
      (message) =>
        message.connection_id === connectionId &&
        message.external_message_id === body.external_message_id,
    );
    if (existing) {
      return HttpResponse.json({
        data: {
          duplicate: true,
          inbound_message: existing,
          ticket: existing.ticket_id ? tickets.get(existing.ticket_id) || null : null,
        },
        request_id: generateRequestId(),
      });
    }

    const now = new Date().toISOString();
    const title =
      body.subject?.trim() ||
      `WeCom message from ${body.external_user_name || body.external_user_id}`;
    const workspaceTickets = Array.from(tickets.values()).filter(
      (ticket) => ticket.workspace_id === channel.workspace_id,
    );
    const email = `wecom-${connectionId}-${body.external_user_id}@channel.local`.toLowerCase();
    let requester = Array.from(users.values()).find((candidate) => candidate.email === email);
    if (!requester) {
      requester = {
        id: generateId(),
        email,
        password: `channel-user-${generateId()}`,
        name: body.external_user_name || body.external_user_id,
        created_at: now,
      };
      users.set(requester.id, requester);
      const members = workspaceMembers.get(channel.workspace_id) || [];
      workspaceMembers.set(channel.workspace_id, [...members, requester.id]);
      persistMockMap('msw:users', users);
      persistMockMap('msw:workspaceMembers', workspaceMembers);
    }
    const ticket = {
      id: generateId(),
      workspace_id: channel.workspace_id,
      number: `TCK-${String(workspaceTickets.length + 1).padStart(6, '0')}`,
      title,
      description: body.text,
      source: 'WECOM' as const,
      status: 'NEW' as const,
      priority: 'P3' as const,
      category: 'channel:wecom',
      requester_id: requester.id,
      assignee_id: null,
      created_at: now,
      updated_at: now,
      resolved_at: null,
      closed_at: null,
      reopen_count: 0,
      service_catalog_item_id: null,
      request_template_id: null,
      response_due_at: null,
      resolution_due_at: null,
    };
    const inbound = {
      id: generateId(),
      workspace_id: channel.workspace_id,
      connection_id: connectionId,
      ticket_id: ticket.id,
      external_message_id: body.external_message_id,
      external_user_id: body.external_user_id,
      external_user_name: body.external_user_name || null,
      subject: title,
      body: body.text,
      status: 'TICKET_CREATED' as const,
      received_at: now,
    };
    tickets.set(ticket.id, ticket);
    ticketMessages.set(ticket.id, []);
    ticketEvents.set(ticket.id, [
      {
        id: generateId(),
        type: 'CREATED',
        actor_id: requester.id,
        from_value: null,
        to_value: ticket.number,
        created_at: now,
      },
    ]);
    channelInboundMessages.set(inbound.id, inbound);
    persistMockMap('msw:tickets', tickets);
    persistMockMap('msw:ticketMessages', ticketMessages);
    persistMockMap('msw:ticketEvents', ticketEvents);
    persistMockMap('msw:channelInboundMessages', channelInboundMessages);

    return HttpResponse.json(
      {
        data: { duplicate: false, inbound_message: inbound, ticket },
        request_id: generateRequestId(),
      },
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
    '/api/v1/workspaces/:workspaceId/tickets/:ticketId/ai-suggestions',
    async ({ request, params }) => {
      await delay(250);
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

      const text = `${ticket.title} ${ticket.description}`.toLowerCase();
      const category = /\b(vpn|wifi|network|connect)\b/.test(text)
        ? 'network'
        : /\b(password|login|permission|access|account)\b/.test(text)
          ? 'access'
          : ticket.category || 'general';
      const priority = /\b(cannot|unable|blocked|unavailable|down)\b/.test(text)
        ? 'P2'
        : ticket.priority;
      const confidence = category === 'general' ? 0.62 : 0.82;
      const suggestion = {
        summary: `${ticket.title}. ${ticket.description}`.slice(0, 180),
        category,
        priority,
        reply_draft:
          category === 'network'
            ? 'Thanks for the details. Please share the error message, device type, network location and whether other users are affected.'
            : 'Thanks for the details. Please share any screenshots, affected users and the business impact so the team can triage quickly.',
        confidence,
        risk_level: 'LOW',
        reasons: [`Matched ${category} request pattern`, `Suggested ${priority} priority`],
        requires_human_review: true,
      };

      return HttpResponse.json({
        data: {
          ai_run: {
            id: generateId(),
            action: 'TICKET_TRIAGE',
            provider: 'mock',
            model: 'rules-v1',
            prompt_version: 'ticket-triage-v1',
            status: 'SUCCEEDED',
            confidence,
            latency_ms: 3,
            risk_level: 'LOW',
            created_at: new Date().toISOString(),
          },
          suggestion,
        },
        request_id: generateRequestId(),
      });
    },
  ),

  http.post(
    '/api/v1/workspaces/:workspaceId/tickets/:ticketId/knowledge-drafts',
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
      if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
        return HttpResponse.json(
          {
            error: {
              code: 'KNOWLEDGE_DRAFT_REQUIRES_RESOLVED_TICKET',
              message: 'Knowledge drafts require a resolved or closed ticket',
            },
            request_id: generateRequestId(),
          },
          { status: 409 },
        );
      }

      const existing = Array.from(knowledgeArticles.values()).find(
        (article) =>
          article.workspace_id === workspaceId &&
          article.source_ticket_id === ticketId &&
          article.status !== 'ARCHIVED',
      );
      if (existing) {
        return HttpResponse.json({
          data: { article: existing },
          request_id: generateRequestId(),
        });
      }

      const now = new Date().toISOString();
      const publicAgentReply = [...(ticketMessages.get(ticketId) || [])]
        .reverse()
        .find(
          (message) => message.visibility === 'PUBLIC' && message.author_id !== ticket.requester_id,
        );
      const article = {
        id: generateId(),
        workspace_id: workspaceId,
        source_ticket_id: ticketId,
        source_type: 'TICKET' as const,
        title: `How to resolve: ${ticket.title}`,
        problem: ticket.description,
        resolution:
          publicAgentReply?.body ||
          'Resolution details need owner review before this article can be published.',
        verification:
          'Confirm the requester can complete the affected workflow and no new error is reported.',
        rollback: 'Reopen the source ticket if the requester reports the issue is not resolved.',
        status: 'DRAFT' as const,
        visibility: 'INTERNAL' as const,
        created_by_id: user.id,
        published_by_id: null,
        published_at: null,
        created_at: now,
        updated_at: now,
      };
      knowledgeArticles.set(article.id, article);
      persistMockMap('msw:knowledgeArticles', knowledgeArticles);

      return HttpResponse.json({
        data: { article },
        request_id: generateRequestId(),
      });
    },
  ),

  http.get('/api/v1/workspaces/:workspaceId/knowledge', async ({ request, params }) => {
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

    const q = new URL(request.url).searchParams.get('q')?.toLowerCase();
    const articles = Array.from(knowledgeArticles.values())
      .filter(
        (article) =>
          article.workspace_id === workspaceId &&
          article.status === 'PUBLISHED' &&
          article.visibility === 'REQUESTER' &&
          (!q ||
            article.title.toLowerCase().includes(q) ||
            article.problem.toLowerCase().includes(q) ||
            article.resolution.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    return HttpResponse.json({
      data: { articles, page: 1, page_size: 20 },
      request_id: generateRequestId(),
    });
  }),

  http.post(
    '/api/v1/workspaces/:workspaceId/knowledge/:articleId/publish',
    async ({ request, params }) => {
      await delay(200);
      const user = getUserFromRequest(request);
      const workspaceId = params.workspaceId as string;
      const articleId = params.articleId as string;
      if (!user || !isWorkspaceMember(workspaceId, user.id)) {
        return HttpResponse.json(
          {
            error: { code: 'FORBIDDEN', message: 'Workspace access denied' },
            request_id: generateRequestId(),
          },
          { status: user ? 403 : 401 },
        );
      }

      const article = knowledgeArticles.get(articleId);
      if (!article || article.workspace_id !== workspaceId) {
        return HttpResponse.json(
          {
            error: { code: 'KNOWLEDGE_NOT_FOUND', message: 'Knowledge article not found' },
            request_id: generateRequestId(),
          },
          { status: 404 },
        );
      }
      if (article.status === 'ARCHIVED') {
        return HttpResponse.json(
          {
            error: {
              code: 'KNOWLEDGE_ARCHIVED',
              message: 'Archived knowledge cannot be published',
            },
            request_id: generateRequestId(),
          },
          { status: 409 },
        );
      }

      const now = new Date().toISOString();
      const updated = {
        ...article,
        status: 'PUBLISHED' as const,
        visibility: 'REQUESTER' as const,
        published_by_id: user.id,
        published_at: now,
        updated_at: now,
      };
      knowledgeArticles.set(articleId, updated);
      persistMockMap('msw:knowledgeArticles', knowledgeArticles);

      return HttpResponse.json({
        data: { article: updated },
        request_id: generateRequestId(),
      });
    },
  ),

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
