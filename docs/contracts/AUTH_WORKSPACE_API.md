# Auth & Workspace API 合约

## 概述

本文档定义认证与工作空间相关的 API 接口合约，包含请求、响应的数据结构和错误码。

## 基础路径

```
/api/v1
```

## 通用约定

### 请求头

| Header | 说明 | 示例 |
|---|---|---|
| Content-Type | 请求体类型 | application/json |
| Authorization | 认证令牌 | Bearer {token} |

### 响应结构

#### 成功响应

```json
{
  "data": {},
  "request_id": "req_xxxxxxxxxx"
}
```

#### 错误响应

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "request_id": "req_xxxxxxxxxx"
}
```

### 通用错误码

| 错误码 | HTTP 状态码 | 说明 |
|---|---|---|
| VALIDATION_ERROR | 400 | 请求参数校验失败 |
| UNAUTHORIZED | 401 | 未认证或令牌无效 |
| FORBIDDEN | 403 | 无权限访问 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 1. 认证接口

### 1.1 注册

**POST** `/api/v1/auth/register`

#### 请求体

```json
{
  "email": "string (必填, 邮箱格式)",
  "password": "string (必填, 最少8位)",
  "name": "string (可选, 用户姓名)"
}
```

#### 成功响应 (201 Created)

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "string",
      "name": "string | null",
      "created_at": "ISO 8601 timestamp"
    },
    "token": {
      "access_token": "string",
      "refresh_token": "string",
      "expires_in": 3600
    }
  },
  "request_id": "string"
}
```

#### 错误响应

| 错误码 | HTTP 状态码 | 场景 |
|---|---|---|
| VALIDATION_ERROR | 400 | 邮箱格式错误、密码过短 |
| EMAIL_ALREADY_EXISTS | 409 | 邮箱已被注册 |

---

### 1.2 登录

**POST** `/api/v1/auth/login`

#### 请求体

```json
{
  "email": "string (必填, 邮箱格式)",
  "password": "string (必填)"
}
```

#### 成功响应 (200 OK)

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "string",
      "name": "string | null",
      "created_at": "ISO 8601 timestamp"
    },
    "token": {
      "access_token": "string",
      "refresh_token": "string",
      "expires_in": 3600
    },
    "workspaces": [
      {
        "id": "uuid",
        "name": "string",
        "slug": "string",
        "role": "owner | admin | agent | requester"
      }
    ]
  },
  "request_id": "string"
}
```

#### 错误响应

| 错误码 | HTTP 状态码 | 场景 |
|---|---|---|
| VALIDATION_ERROR | 400 | 邮箱格式错误 |
| INVALID_CREDENTIALS | 401 | 邮箱或密码错误 |
| USER_NOT_FOUND | 404 | 用户不存在 |

---

### 1.3 刷新令牌

**POST** `/api/v1/auth/refresh`

#### 请求体

```json
{
  "refresh_token": "string (必填)"
}
```

#### 成功响应 (200 OK)

```json
{
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 3600
  },
  "request_id": "string"
}
```

---

### 1.4 获取当前用户信息

**GET** `/api/v1/auth/me`

#### 请求头

```
Authorization: Bearer {access_token}
```

#### 成功响应 (200 OK)

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "string",
      "name": "string | null",
      "created_at": "ISO 8601 timestamp"
    },
    "workspaces": [
      {
        "id": "uuid",
        "name": "string",
        "slug": "string",
        "role": "owner | admin | agent | requester"
      }
    ]
  },
  "request_id": "string"
}
```

---

## 2. 工作空间接口

### 2.1 创建工作空间

**POST** `/api/v1/workspaces`

#### 请求头

```
Authorization: Bearer {access_token}
```

#### 请求体

```json
{
  "name": "string (必填, 1-100字符)",
  "slug": "string (必填, 英文小写、数字、短横线, 3-50字符)",
  "timezone": "string (可选, 默认 Asia/Shanghai)",
  "language": "string (可选, 默认 zh-CN)"
}
```

#### 成功响应 (201 Created)

```json
{
  "data": {
    "workspace": {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "timezone": "string",
      "language": "string",
      "role": "owner",
      "created_at": "ISO 8601 timestamp"
    }
  },
  "request_id": "string"
}
```

#### 错误响应

| 错误码 | HTTP 状态码 | 场景 |
|---|---|---|
| VALIDATION_ERROR | 400 | 名称过短、slug格式错误 |
| SLUG_ALREADY_EXISTS | 409 | 工作区简称已被占用 |
| UNAUTHORIZED | 401 | 未登录 |

---

### 2.2 获取工作空间列表

**GET** `/api/v1/workspaces`

#### 请求头

```
Authorization: Bearer {access_token}
```

#### 成功响应 (200 OK)

```json
{
  "data": {
    "workspaces": [
      {
        "id": "uuid",
        "name": "string",
        "slug": "string",
        "timezone": "string",
        "language": "string",
        "role": "owner | admin | agent | requester",
        "created_at": "ISO 8601 timestamp"
      }
    ]
  },
  "request_id": "string"
}
```

---

### 2.3 获取工作空间详情

**GET** `/api/v1/workspaces/{workspace_id}`

#### 请求头

```
Authorization: Bearer {access_token}
```

#### 成功响应 (200 OK)

```json
{
  "data": {
    "workspace": {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "timezone": "string",
      "language": "string",
      "role": "owner | admin | agent | requester",
      "created_at": "ISO 8601 timestamp"
    }
  },
  "request_id": "string"
}
```

---

## 数据字典

### User 对象

| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 用户唯一标识 |
| email | string | 邮箱地址 |
| name | string \| null | 用户姓名 |
| created_at | string | 创建时间 (ISO 8601) |

### Workspace 对象

| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 工作区唯一标识 |
| name | string | 工作区名称 |
| slug | string | 工作区简称 (URL友好) |
| timezone | string | 时区 (IANA 格式) |
| language | string | 语言 (zh-CN / en) |
| role | string | 当前用户在工作区的角色 |
| created_at | string | 创建时间 (ISO 8601) |

### Token 对象

| 字段 | 类型 | 说明 |
|---|---|---|
| access_token | string | 访问令牌 |
| refresh_token | string | 刷新令牌 |
| expires_in | number | 过期时间 (秒) |
