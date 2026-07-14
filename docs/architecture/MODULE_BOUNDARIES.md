# 模块边界

## 模块划分原则

1. **高内聚低耦合：每个模块内部高度内聚，模块间松耦合
2. **领域驱动：按业务领域划分模块，而非技术层
3. **依赖方向：上层模块依赖下层模块，不允许反向依赖
4. **接口契约：模块间通过明确的接口和DTO交互

## 模块依赖关系

```
┌─────────────────────────────────────────────────────┐
│                   API 层                          │
│  (Controllers / Resolvers / Gateways)          │
└──────────────┬──────────────────────────────────┘
               │ 依赖
               ▼
┌──────────────────────────────────────────────────────┐
│                   领域服务层                       │
│  (Services / Domain Models / Repositories)            │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ workspace│ │  ticket  │ │knowledge│        │
│  └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │   ai     │ │automation│ │ billing  │        │
│  └──────────┘ └──────────┘ └──────────┘        │
└──────────────┬──────────────────────────────────┘
               │ 依赖
               ▼
┌──────────────────────────────────────────────────────┐
│                 基础设施层                         │
│  (Prisma / Redis / Mail / Storage / Queue)             │
└──────────────────────────────────────────────────────┘
```

## 模块详情

### 1. Workspace 模块

**职责：** 工作空间、用户、成员、角色、权限、团队、邀请

**目录结构：**
```
src/modules/workspace/
├── workspace.module.ts
├── services/
│   ├── workspace.service.ts
│   ├── workspace-member.service.ts
│   ├── role.service.ts
│   ├── team.service.ts
│   └── invitation.service.ts
├── repositories/
│   ├── workspace.repository.ts
│   ├── workspace-member.repository.ts
│   ├── role.repository.ts
│   ├── team.repository.ts
│   └── invitation.repository.ts
├── dto/
│   ├── workspace.dto.ts
│   ├── member.dto.ts
│   ├── role.dto.ts
│   ├── team.dto.ts
│   └── invitation.dto.ts
├── decorators/
│   ├── tenant.decorator.ts
│   └── workspace.decorator.ts
├── middlewares/
│   └── tenant.middleware.ts
└── guards/
    └── workspace-role.guard.ts
```

**对外接口：**
- WorkspaceService：工作空间 CRUD
- WorkspaceMemberService：成员管理
- RoleService：角色与权限
- TeamService：团队管理
- InvitationService：邀请管理

**依赖模块：**
- 无（核心基础模块）

### 2. Ticket 模块

**职责：** 请求接入、工单生命周期、消息、SLA

**依赖模块：**
- Workspace 模块

### 3. Knowledge 模块

**职责：** 知识源、文档、切片、检索

**依赖模块：**
- Workspace 模块

### 4. AI 模块

**职责：** 模型网关、分类、摘要、RAG、工具调用

**依赖模块：**
- Workspace 模块
- Ticket 模块
- Knowledge 模块

### 5. Automation 模块

**职责：** 规则引擎、连接器、审批

**依赖模块：**
- Workspace 模块
- Ticket 模块

### 6. Billing 模块

**职责：** 套餐、订阅、用量、支付

**依赖模块：**
- Workspace 模块

## 跨模块通信规则

1. 模块间通过 Service 层交互，不直接访问 Repository
2. 使用 DTO 传输数据，不直接暴露数据库实体
3. 异步事件通过事务 Outbox 模式
4. 禁止循环依赖

## 租户隔离规则

1. 所有业务表必须包含 workspace_id
2. Repository 层默认注入 workspace_id 过滤条件
3. 通过 TenantContext 从请求中提取 workspace_id
4. 关键表启用 RLS（行级安全）
