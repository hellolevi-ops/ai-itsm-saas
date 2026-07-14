# T-003: Auth & Workspace Web 前端实现

## 任务概述

实现 AI ITSM SaaS 产品的认证与工作空间创建相关的前端页面，包括注册、登录和创建工作区三个核心页面。

## 背景与目标

- 后端 API 尚未完成，前端需使用 Mock Service Worker (MSW) 进行开发
- 严格遵循 AUTH_WORKSPACE_API.md 中定义的接口合约
- 为后续后端联调打好基础

## 范围

### 包含
- 注册页面 (/register)
- 登录页面 (/login)
- 创建工作区页面 (/workspaces/create)
- 基础表单校验
- 加载状态和错误状态处理
- MSW Mock 接口
- 组件测试和页面测试

### 不包含
- 后端代码修改
- Prisma Schema 修改
- 完整管理后台
- 忘记密码功能
- 第三方登录 (OAuth)

## 技术栈

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form + Zod (表单校验)
- MSW (Mock Service Worker)
- Vitest + React Testing Library (测试)

## 验收标准

1. 注册页面
   - 邮箱格式校验
   - 密码强度校验 (最少8位)
   - 确认密码一致性校验
   - 提交时显示加载状态
   - 错误时显示错误信息
   - 注册成功后跳转到创建工作区页面

2. 登录页面
   - 邮箱格式校验
   - 密码非空校验
   - 提交时显示加载状态
   - 错误时显示错误信息
   - 登录成功后跳转到首页/工作台

3. 创建工作区页面
   - 工作区名称非空校验
   - 工作区简称校验 (英文、数字、短横线)
   - 时区选择 (默认 Asia/Shanghai)
   - 提交时显示加载状态
   - 错误时显示错误信息
   - 创建成功后跳转到工作台

4. 所有请求和响应字段严格遵循 AUTH_WORKSPACE_API.md

## 相关文档

- API 合约: docs/contracts/AUTH_WORKSPACE_API.md
- MVP 范围: docs/product/MVP_SCOPE.md
- PRD: docs/product/PRD.md
