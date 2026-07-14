# T-001: 租户工作空间模型

## 任务概述

建立多租户架构的核心数据模型和领域服务，实现 Tenant-Workspace 双层租户隔离架构。

## 背景

根据 PRD 5.3 租户隔离要求，所有业务表必须包含租户归属标识。本任务建立租户模型的基础，采用 Tenant（顶层租户）+ Workspace（工作空间）双层架构：
- **Tenant**：代表一个客户组织，是顶层租户隔离单元
- **Workspace**：属于 Tenant 的工作空间，是业务数据的直接隔离单元
- **User**：直接归属于 Tenant，通过 WorkspaceMember 关联到 Workspace

## 目标

1. 建立 Tenant（租户）数据模型
2. 建立 Workspace（工作空间）数据模型，含 tenant_id 外键
3. 建立 User（用户）数据模型，含 tenant_id 外键
4. 建立 WorkspaceMember（工作区成员）模型，含 workspace_id + user_id 唯一约束
5. 建立 Role（角色）模型（最小实现，支持系统角色初始化）
6. 实现租户隔离机制（AsyncLocalStorage + Middleware + Guard）
7. 提供工作空间 CRUD 领域服务和 REST API（含鉴权）
8. 提供成员管理领域服务和 REST API（含鉴权）

## 范围

### 包含

- Prisma 数据模型定义（Tenant, User, Workspace, WorkspaceMember, Role）
- 数据库迁移文件（prisma/migrations）
- 工作空间领域服务（WorkspaceService + Repository）
- 成员管理服务（WorkspaceMemberService + Repository）
- 角色服务（RoleService，最小实现，仅系统角色初始化）
- 租户上下文（Tenant Context）- AsyncLocalStorage 实现
- 租户隔离中间件（TenantMiddleware）- 从认证会话读取
- 角色守卫（WorkspaceRoleGuard）- 基于 roleType 校验
- REST API 接口（Controllers，含 @UseGuards 鉴权）
- JWT Auth Guard 占位符（T-003 将替换为完整实现）
- 单元测试（含并发隔离测试、跨租户拒绝测试、Guard 逻辑测试）

### 不包含

- 注册和登录 API（T-003）
- 前端页面
- 邀请邮件发送
- 计费/订阅功能
- Team/TeamMember 实体（P1 后续任务）
- Permission/RolePermission 权限矩阵（P1 后续任务）
- Invitation 邀请流程（P1 后续任务）

### 禁止修改的目录

- `docs/product/PRD.md` - 产品需求基线文档
- `docs/product/BUSINESS_PLAN.md` - 商业计划书
- `docs/architecture/SYSTEM_CONTEXT.md` - 已发布的系统架构设计基线

## 数据模型

### 核心表

1. **tenants** - 租户（顶层组织）
   - id, name, slug, status, created_at, updated_at

2. **users** - 用户（直接归属于 Tenant）
   - id, tenant_id, email, name, avatar_url, created_at, updated_at
   - 唯一约束: (tenant_id, email)
   - 索引: tenant_id

3. **workspaces** - 工作空间（属于 Tenant）
   - id, tenant_id, name, slug, timezone, language, status, created_at, updated_at
   - 唯一约束: (tenant_id, slug)
   - 索引: tenant_id, status

4. **workspace_members** - 工作空间成员
   - id, workspace_id, user_id, role_id, joined_at, created_at, updated_at
   - 唯一约束: (workspace_id, user_id)
   - 索引: workspace_id, user_id

5. **roles** - 角色（属于 Workspace）
   - id, workspace_id, name, description, role_type, is_system, created_at, updated_at
   - 唯一约束: (workspace_id, name)
   - 索引: workspace_id

## 租户隔离机制

### 三层隔离

1. **请求级**: TenantMiddleware 从 req.user 读取 tenantId/workspaceId，验证用户 membership
2. **上下文级**: TenantContextHolder 使用 AsyncLocalStorage（非进程级 Map），确保并发请求不串租户
3. **数据级**: Repository 层自动注入 tenant_id/workspace_id 过滤条件

### 鉴权链

```
JwtAuthGuard（占位符，T-003 替换）
  → TenantMiddleware（验证 workspace 归属 + membership）
    → WorkspaceRoleGuard（验证角色权限，基于 roleType 而非 roleId）
```

## API 接口契约

### 工作空间接口（需 OWNER/ADMIN 角色创建/更新/删除）

| 方法 | 路径 | 鉴权 | 描述 |
|------|------|------|------|
| POST | /api/workspaces | OWNER/ADMIN | 创建工作空间 |
| GET | /api/workspaces | 任意成员 | 获取当前租户的工作空间列表 |
| GET | /api/workspaces/:id | 任意成员 | 获取工作空间详情 |
| PUT | /api/workspaces/:id | OWNER/ADMIN | 更新工作空间 |
| DELETE | /api/workspaces/:id | OWNER | 删除工作空间 |

### 成员管理接口（需 OWNER/ADMIN 角色增删改）

| 方法 | 路径 | 鉴权 | 描述 |
|------|------|------|------|
| POST | /api/workspaces/:id/members | OWNER/ADMIN | 添加成员 |
| GET | /api/workspaces/:id/members | 任意成员 | 获取成员列表 |
| PUT | /api/workspaces/:id/members/:userId | OWNER/ADMIN | 更新成员角色 |
| DELETE | /api/workspaces/:id/members/:userId | OWNER | 移除成员 |

## 验收标准

### 阻塞项（必须满足）

- [ ] **Tenant 实体存在**：prisma/schema.prisma 包含 Tenant 模型
- [ ] **User 含 tenant_id**：users 表有 tenant_id 列、外键、唯一约束 (tenant_id, email)、索引
- [ ] **Workspace 含 tenant_id**：workspaces 表有 tenant_id 列、外键、唯一约束 (tenant_id, slug)、索引
- [ ] **WorkspaceMember 唯一约束**：(workspace_id, user_id) 唯一约束
- [ ] **AsyncLocalStorage 上下文**：TenantContextHolder 使用 AsyncLocalStorage，并发请求互不干扰
- [ ] **Middleware 从认证会话读取**：tenant.middleware.ts 从 req.user 读取，不直接信任 header
- [ ] **Middleware 校验 membership**：验证 user 是 workspace 成员且 workspace 属于 user.tenantId
- [ ] **Controller 挂载 Guards**：所有 Controller 使用 @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
- [ ] **Guard 比较 roleType**：WorkspaceRoleGuard.validateRole 加载 member.role 并比较 roleType（非 roleId）
- [ ] **Repository 自动过滤**：WorkspaceRepository 查询自动注入 tenant_id 条件

### 测试要求

- [ ] **并发隔离测试**：证明两个并发请求使用不同 tenantId 不会互相污染
- [ ] **跨租户拒绝测试**：用户 A 无法访问用户 B 的 workspace 数据（返回 403）
- [ ] **Guard 逻辑测试**：证明 roleId(UUID) 与 RoleType(枚举) 直接比较会失败，roleType 比较才正确
- [ ] **中间件测试**：无 req.user 时跳过，跨 tenant 时拒绝，非成员时拒绝
- [ ] **类型检查通过**：npm run typecheck
- [ ] **Lint 通过**：npm run lint:check
- [ ] **全部测试通过**：npm test
