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

export type BillingPlanCode = 'FREE' | 'TEAM' | 'GROWTH' | 'BUSINESS';
export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type WorkspaceSubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED';
export type PaymentOrderStatus = 'PENDING' | 'ACTIVATED' | 'CANCELED';

export interface BillingPlan {
  code: BillingPlanCode;
  name: string;
  monthly_amount_cents: number;
  yearly_amount_cents: number;
  currency: 'CNY';
  limits: {
    agents: number;
    monthly_tickets: number;
    monthly_ai_actions: number;
    channels: number;
  };
}

export interface BillingEntitlements {
  plan_code: BillingPlanCode;
  limits: BillingPlan['limits'];
  usage: {
    monthly_tickets_used: number;
  };
  remaining: {
    monthly_tickets: number;
  };
}

export interface WorkspaceSubscription {
  id: string;
  workspace_id: string;
  plan_code: BillingPlanCode;
  billing_cycle: BillingCycle;
  status: WorkspaceSubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentOrder {
  id: string;
  workspace_id: string;
  subscription_id: string | null;
  plan_code: BillingPlanCode;
  billing_cycle: BillingCycle;
  amount_cents: number;
  currency: 'CNY';
  status: PaymentOrderStatus;
  requested_by_id: string;
  activated_by_id: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingOverviewResponse {
  plans: BillingPlan[];
  subscription: WorkspaceSubscription | null;
  current_plan: BillingPlan;
  entitlements: BillingEntitlements;
  orders: PaymentOrder[];
}

export interface CreatePaymentOrderRequest {
  plan_code: Exclude<BillingPlanCode, 'FREE'>;
  billing_cycle: BillingCycle;
}

export interface CreatePaymentOrderResponse {
  order: PaymentOrder;
}

export interface ActivatePaymentOrderResponse {
  order: PaymentOrder;
  subscription: WorkspaceSubscription;
  current_plan: BillingPlan;
  entitlements: BillingEntitlements;
}

export type ComplianceDocumentStatus = 'DRAFT_FOR_REVIEW' | 'EXTERNAL_REVIEW_REQUIRED';

export type ComplianceDocumentCategory =
  'TERMS' | 'PRIVACY' | 'DATA_RIGHTS' | 'AI' | 'SECURITY' | 'OPERATIONS' | 'FILING';

export interface ComplianceDocument {
  slug: string;
  title: string;
  category: ComplianceDocumentCategory;
  status: ComplianceDocumentStatus;
  owner: string;
  review_required: true;
  effective_status: 'NOT_EFFECTIVE';
  repository_path: string;
  summary: string;
}

export interface CompliancePackageResponse {
  package_version: string;
  jurisdiction: 'CN';
  status: 'DRAFT_FOR_PROFESSIONAL_REVIEW';
  professional_review_required: true;
  legal_final_judgment: false;
  production_effective: false;
  last_updated_at: string;
  documents: ComplianceDocument[];
}

export type BetaFeedbackType = 'FEEDBACK' | 'BUG' | 'INTERVIEW_NOTE';
export type BetaFeedbackSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BetaFeedbackStatus = 'OPEN' | 'TRIAGED' | 'CLOSED';

export interface BetaDocument {
  slug: string;
  title: string;
  repository_path: string;
  summary: string;
}

export interface BetaFeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  default_enabled?: boolean;
  changed_by_user_id: string | null;
  changed_at: string | null;
}

export interface BetaFeedback {
  id: string;
  workspace_id: string;
  reporter_id: string;
  type: BetaFeedbackType;
  severity: BetaFeedbackSeverity;
  title: string;
  description: string;
  status: BetaFeedbackStatus;
  created_at: string;
  updated_at: string;
}

export interface BetaPackageResponse {
  package_version: string;
  status: 'INTERNAL_BETA_READY';
  environment: 'pre_release_test';
  production_release: false;
  paid_external_resources_required: false;
  external_customer_recruiting_required: true;
  last_updated_at: string;
  seed_workspace: {
    recommended_name: string;
    recommended_slug: string;
    default_timezone: string;
    recommended_roles: string[];
  };
  invitation_controls: {
    mode: string;
    whitelist_required_for_real_design_partners: boolean;
    existing_endpoint: string;
  };
  documents: BetaDocument[];
  exit_criteria: string[];
}

export interface BetaWorkspaceReadinessResponse extends BetaPackageResponse {
  workspace_id: string;
  feature_flags: BetaFeatureFlag[];
  feedback: BetaFeedback[];
  feedback_summary: {
    total: number;
    open: number;
    bugs: number;
    high_or_critical: number;
  };
}

export interface CreateBetaFeedbackRequest {
  type: BetaFeedbackType;
  severity?: BetaFeedbackSeverity;
  title: string;
  description: string;
}

export interface CreateBetaFeedbackResponse {
  feedback: BetaFeedback;
}

export interface UpdateBetaFeatureFlagResponse {
  feature_flag: BetaFeatureFlag;
}

export interface ReleaseCandidateGate {
  key: string;
  title: string;
  status:
    | 'PASS_LOCAL'
    | 'PASS_LOCAL_WITH_REVIEW_GAP'
    | 'PASS_LOCAL_WITH_MOCK_PROVIDER'
    | 'PASS_WITH_KNOWN_RISK'
    | 'DOCUMENTED_NOT_LOAD_TESTED'
    | 'RUNBOOK_READY_NOT_PRODUCTION_DRILLED'
    | 'PASS_LOCAL_WITH_RUNBOOK'
    | 'PARTIAL_LOCAL'
    | 'PASS_LOCAL_MANUAL_ONLY'
    | 'DRAFT_READY_FOR_PROFESSIONAL_REVIEW'
    | 'TECHNICAL_LOOP_READY_EXTERNAL_EVIDENCE_REQUIRED';
  evidence: string[];
}

export interface ReleaseCandidatePackageResponse {
  package_version: string;
  status: 'RELEASE_CANDIDATE_PREPARED';
  production_release: false;
  merge_to_main_approved: false;
  legal_final_judgment: false;
  paid_external_resources_required: false;
  last_updated_at: string;
  gates: ReleaseCandidateGate[];
  human_actions_required: string[];
  reports: string[];
}
