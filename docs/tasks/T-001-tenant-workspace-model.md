# T-001: 租户工作空间模型

## 任务概述

建立多租户架构的核心数据模型和领域服务，实现工作空间（Workspace）作为租户隔离的基本单元。

## 背景

根据 PRD 5.3 租户隔离要求，所有业务表必须包含 workspace_id，所有查询默认注入租户条件。本任务建立租户模型的基础。

## 目标

1. 建立 Workspace（工作空间）数据模型
2. 建立 User（用户）和 WorkspaceMember（工作区成员）模型
3. 建立 Team（团队）模型
4. 建立 Role（角色）和 Permission（权限）模型
5. 建立 Invitation（邀请）模型
6. 实现租户隔离机制（装饰器/中间件）
7. 提供工作空间 CRUD 领域服务和 REST API

## 范围

### 包含

- Prisma 数据模型定义
- 数据库迁移文件（prisma/migrations）
- 工作空间领域服务（WorkspaceService + Repository）
- 租户上下文（Tenant Context）装饰器和中间件
- REST API 接口（Controllers）
- 单元测试

### 不包含

- 注册和登录 API
- 前端页面
- 邀请邮件发送
- 计费/订阅功能

## 数据模型

### 核心表

1. **workspaces** - 工作空间（租户）
   - id, name, slug, timezone, language, status, created_at, updated_at

2. **users** - 用户
   - id, email, name, avatar_url, created_at, updated_at

3. **workspace_members** - 工作空间成员
   - id, workspace_id, user_id, role_id, joined_at, created_at, updated_at

4. **roles** - 角色
   - id, workspace_id, name, description, role_type, is_system, created_at, updated_at

5. **permissions** - 权限
   - id, resource, action, description

6. **role_permissions** - 角色权限关联
   - role_id, permission_id

7. **teams** - 团队
   - id, workspace_id, name, description, created_at, updated_at

8. **team_members** - 团队成员
   - team_id, user_id, workspace_id

9. **invitations** - 邀请
   - id, workspace_id, email, role_id, invited_by, expires_at, accepted_at, status, created_at

## API 接口契约

### 工作空间接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/workspaces | 创建工作空间 |
| GET | /api/workspaces | 获取当前用户的工作空间列表 |
| GET | /api/workspaces/:id | 获取工作空间详情 |
| PUT | /api/workspaces/:id | 更新工作空间 |
| DELETE | /api/workspaces/:id | 删除工作空间 |

### 成员管理接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/workspaces/:id/members | 添加成员 |
| GET | /api/workspaces/:id/members | 获取成员列表 |
| PUT | /api/workspaces/:id/members/:userId | 更新成员角色 |
| DELETE | /api/workspaces/:id/members/:userId | 移除成员 |

### 角色接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/workspaces/:id/roles | 获取角色列表 |
| POST | /api/workspaces/:id/roles | 创建自定义角色 |
| GET | /api/workspaces/:id/roles/:id | 获取角色详情 |
| PUT | /api/workspaces/:id/roles/:id | 更新角色 |
| DELETE | /api/workspaces/:id/roles/:id | 删除角色 |

### 团队接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/workspaces/:id/teams | 创建团队 |
| GET | /api/workspaces/:id/teams | 获取团队列表 |
| GET | /api/workspaces/:id/teams/:id | 获取团队详情 |
| PUT | /api/workspaces/:id/teams/:id | 更新团队 |
| DELETE | /api/workspaces/:id/teams/:id | 删除团队 |

### 邀请接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/workspaces/:id/invitations | 发送邀请 |
| GET | /api/workspaces/:id/invitations | 获取邀请列表 |
| PUT | /api/workspaces/:id/invitations/:id | 撤销邀请 |

## 验收标准

### 文档验收

- [ ] 任务文档存在：docs/tasks/T-001-tenant-workspace-model.md
- [ ] 产品文档存在：docs/product/MVP_SCOPE.md
- [ ] 架构文档存在：docs/architecture/SYSTEM_CONTEXT.md

### 代码验收

- [ ] 开发分支存在：feat/T-001-tenant-workspace-model
- [ ] 与 main 分支有差异可供审查
- [ ] Prisma schema 定义完整：prisma/schema.prisma
- [ ] 数据库迁移存在：prisma/migrations/
- [ ] API 接口实现：Controllers 层
- [ ] 领域服务实现：Services 层
- [ ] 数据访问层：Repositories 层
- [ ] 租户隔离中间件：TenantMiddleware
- [ ] 租户上下文：TenantContextHolder

### 数据模型验收

- [ ] workspaces 表包含 workspace_id（作为主键）
- [ ] workspace_members 表包含 workspace_id
- [ ] roles 表包含 workspace_id
- [ ] teams 表包含 workspace_id
- [ ] team_members 表包含 workspace_id
- [ ] invitations 表包含 workspace_id

### 测试验收

- [ ] 工作空间服务测试：workspace.service.spec.ts
- [ ] 成员服务测试：workspace-member.service.spec.ts
- [ ] 角色服务测试：role.service.spec.ts
- [ ] 团队服务测试：team.service.spec.ts
- [ ] 邀请服务测试：invitation.service.spec.ts
- [ ] 租户上下文测试：tenant-context.spec.ts
- [ ] 测试覆盖率 ≥ 80%

### 质量验收

- [ ] TypeScript 类型检查通过（npm run typecheck）
- [ ] Lint 通过（npm run lint:check）
- [ ] 单元测试全部通过（npm test）
