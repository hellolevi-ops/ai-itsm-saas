export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  language: string;
  role: 'owner' | 'admin' | 'agent' | 'requester';
  created_at: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface ApiResponse<T> {
  data: T;
  request_id: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  request_id: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface RegisterResponse {
  user: User;
  token: Token;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: Token;
  workspaces: Workspace[];
}

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
  timezone?: string;
  language?: string;
}

export interface CreateWorkspaceResponse {
  workspace: Workspace;
}

export interface GetWorkspacesResponse {
  workspaces: Workspace[];
}

export interface GetMeResponse {
  user: User;
  workspaces: Workspace[];
}

export type TicketStatus = 'NEW' | 'TRIAGE' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED';

export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type TicketMessageVisibility = 'PUBLIC' | 'INTERNAL';

export interface Ticket {
  id: string;
  workspace_id: string;
  number: string;
  title: string;
  description: string;
  source: 'WEB' | 'WECOM';
  status: TicketStatus;
  priority: TicketPriority;
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
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  visibility: TicketMessageVisibility;
  body: string;
  created_at: string;
}

export interface TicketEvent {
  id: string;
  type: string;
  actor_id: string | null;
  from_value: string | null;
  to_value: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority?: TicketPriority;
  category?: string;
  request_template_id?: string;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  category?: string;
}

export interface AssignTicketRequest {
  assignee_id: string;
}

export interface AddTicketMessageRequest {
  visibility: TicketMessageVisibility;
  body: string;
}

export interface ChangeTicketStatusRequest {
  status: TicketStatus;
  reason?: string;
}

export interface CreateTicketResponse {
  ticket: Ticket;
}

export interface ListTicketsResponse {
  tickets: Ticket[];
  page: number;
  page_size: number;
}

export interface TicketDetailResponse {
  ticket: Ticket;
  messages: TicketMessage[];
  events: TicketEvent[];
}

export interface TicketMessageResponse {
  message: TicketMessage;
}

export interface AiRunSummary {
  id: string;
  action: 'TICKET_TRIAGE';
  provider: string;
  model: string;
  prompt_version: string;
  status: 'SUCCEEDED' | 'FAILED';
  confidence: number;
  latency_ms: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
}

export interface TicketAiSuggestion {
  summary: string;
  category: string;
  priority: TicketPriority;
  reply_draft: string;
  confidence: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  requires_human_review: boolean;
}

export interface TicketAiSuggestionResponse {
  ai_run: AiRunSummary;
  suggestion: TicketAiSuggestion;
}

export type KnowledgeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type KnowledgeVisibility = 'INTERNAL' | 'REQUESTER';

export interface KnowledgeArticle {
  id: string;
  workspace_id: string;
  source_ticket_id: string | null;
  source_type: 'TICKET' | 'MANUAL';
  title: string;
  problem: string;
  resolution: string;
  verification: string;
  rollback: string | null;
  status: KnowledgeStatus;
  visibility: KnowledgeVisibility;
  created_by_id: string;
  published_by_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDraftResponse {
  article: KnowledgeArticle;
}

export interface ListKnowledgeResponse {
  articles: KnowledgeArticle[];
  page: number;
  page_size: number;
}

export interface ServiceCatalogItem {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  category: string | null;
  default_priority: TicketPriority;
  response_target_minutes: number;
  resolution_target_minutes: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface RequestTemplate {
  id: string;
  workspace_id: string;
  service_catalog_item_id: string;
  name: string;
  description: string | null;
  default_title: string;
  default_description: string;
  default_priority: TicketPriority;
  default_category: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  service_catalog_item: ServiceCatalogItem;
  created_at: string;
  updated_at: string;
}

export interface ServiceCatalogResponse {
  service_catalog_items: ServiceCatalogItem[];
  request_templates: RequestTemplate[];
}

export interface CreateServiceCatalogItemRequest {
  name: string;
  description: string;
  category?: string;
  default_priority?: TicketPriority;
  response_target_minutes?: number;
  resolution_target_minutes?: number;
}

export interface CreateRequestTemplateRequest {
  service_catalog_item_id: string;
  name: string;
  description?: string;
  default_title: string;
  default_description: string;
  default_priority?: TicketPriority;
  default_category?: string;
}

export interface CreateServiceCatalogItemResponse {
  service_catalog_item: ServiceCatalogItem;
}

export interface CreateRequestTemplateResponse {
  request_template: RequestTemplate;
}

export interface ChannelConnection {
  id: string;
  workspace_id: string;
  type: 'WECOM';
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelInboundMessage {
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
}

export interface ListChannelsResponse {
  channels: ChannelConnection[];
}

export interface CreateWeComChannelRequest {
  name: string;
  token: string;
}

export interface CreateWeComChannelResponse {
  channel: ChannelConnection;
}

export interface ReceiveWeComMessageRequest {
  external_message_id: string;
  external_user_id: string;
  external_user_name?: string;
  subject?: string;
  text: string;
}

export interface ReceiveWeComMessageResponse {
  duplicate: boolean;
  inbound_message: ChannelInboundMessage;
  ticket: Ticket | null;
}

export type WorkspaceInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string | null;
  role_type: 'OWNER' | 'ADMIN' | 'AGENT' | 'REQUESTER';
  status: WorkspaceInvitationStatus;
  invited_by_id: string;
  accepted_by_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListInvitationsResponse {
  invitations: WorkspaceInvitation[];
}

export interface CreateInvitationRequest {
  email?: string;
  role_type?: 'AGENT' | 'REQUESTER';
}

export interface CreateInvitationResponse {
  invitation: WorkspaceInvitation;
  token: string;
}

export interface AcceptInvitationRequest {
  token: string;
  email: string;
  password: string;
  name?: string;
}

export interface AcceptInvitationResponse {
  user: User;
  token: Token;
  workspace: Workspace;
  invitation: WorkspaceInvitation;
}
