# Change Proposal: 初始化前端项目

## Summary
使用 Vite + React 19 + Ant Design 5 初始化 admission-frontend 项目，完成 Landing Page、登录/注册页面、Dashboard 和个人中心页面，对接 admission-api 的 JWT 认证体系。

## Motivation
当前 admission-frontend 仓库为空，需要搭建企业级前端项目骨架。后端 admission-api 已具备完整的用户认证（JWT 双 Token + RBAC）和 Swagger 文档，前端需与之对接，提供用户访问入口。

## Scope

### In Scope
- Vite 项目脚手架 + TypeScript 配置
- React Router 7 路由系统（landing / login / register / dashboard / profile）
- Ant Design 5 集成 + 企业级主题配置（政府央企风格）
- Zustand 认证状态管理（Access Token 内存存储 + Refresh Token localStorage）
- Axios API 客户端 + 401 静默刷新拦截器 + `X-Platform: web` 请求头注入
- openapi-typescript 从后端 Swagger 自动生成 API 类型
- Landing Page（顶部导航 + Banner + 服务卡片 + 页脚）
- 登录/注册页面（表单 + 表单校验 + 错误提示）
- Dashboard 页面（基础布局）
- 个人中心页面（展示用户信息）
- 路由守卫：未登录用户访问受保护路由重定向至 /login
- 全局 Loading 状态（认证恢复时展示）

### Non-goals
- 服务端渲染（SSR）
- 界面设计细节（当前以功能可用为主，后续迭代优化视觉效果）
- 多语言国际化
- 单元测试（后续补充）
- 复杂的状态管理（Zustand 足够当前需求）

## User Flow

### 注册成功 → 自动登录 → 跳转 Dashboard
注册表单提交成功后，自动调用登录接口获取 Token，直接跳转 `/dashboard`，无需用户再次输入密码。若自动登录失败（如后端策略变更），则回退至 `/login` 页面并提示用户手动登录。

### 已登录用户访问 /login 或 /register
自动重定向至 `/dashboard`。

## Acceptance Criteria
- [ ] `npm run dev` 启动开发服务器无报错
- [ ] 访问 `/` 展示 Landing Page
- [ ] 访问 `/login` 展示登录表单，正确表单校验
- [ ] 访问 `/register` 展示注册表单，正确表单校验
- [ ] 登录成功后跳转 `/dashboard`，且请求自动携带 Authorization header
- [ ] 关闭浏览器后重新打开，能通过 Refresh Token 静默恢复登录状态
- [ ] 访问 `/profile` 展示当前登录用户信息
- [ ] 未登录访问 `/dashboard` 或 `/profile` 自动重定向至 `/login`
- [ ] 登出后清除所有 Token 状态，重定向至 `/login`

## Dependencies
- admission-api 后端服务需处于可访问状态（默认 `http://localhost:8080`）
- 后端接口：POST /api/v1/auth/login, POST /api/v1/auth/register, POST /api/v1/auth/refresh, GET /api/v1/me
- 所有请求必须携带 `X-Platform: web` 请求头（后端平台识别中间件要求）

## Risks
| 风险 | 缓解措施 |
|------|----------|
| AntD 与 Vite 可能有未知兼容问题 | AntD 5 官方支持 Vite，且社区使用广泛 |
| 后端接口字段变更导致类型不同步 | openapi-typescript 脚本可随时重跑更新 |
| 认证恢复 loading 影响体验 | 使用全局 Spin 覆盖，极简设计 |
| 后端 CORS 配置与前端开发冲突 | 后端 `cors.go` 设置了 `Access-Control-Allow-Origin: *` 与 `Allow-Credentials: true`，浏览器会拒绝。开发时后端需修改为白名单 Origin（如 `http://localhost:5173`）|