# Tasks: 初始化前端项目

## 阶段一：项目脚手架

- [x] **T1.1** 初始化 Vite + React 19 + TypeScript 项目（`npm create vite@latest`）
- [x] **T1.2** 安装依赖：react-router-dom, zustand, axios, antd, @ant-design/icons, openapi-typescript
- [x] **T1.3** 配置 TypeScript（tsconfig.json / tsconfig.app.json / tsconfig.node.json）
- [x] **T1.4** 配置 Vite（vite.config.ts + 开发代理 + 别名 @/src）
- [x] **T1.5** 配置 ESLint + Prettier（可选，保持代码风格一致）
- [x] **T1.6** 配置 Ant Design 主题（ConfigProvider + 企业级主题 token）
- [x] **T1.7** 配置环境变量（.env + .env.example，VITE_API_BASE_URL）

## 阶段二：认证体系

- [x] **T2.1** 创建 `src/stores/authStore.ts`（Zustand：login/register/logout/restore/setAccessToken）
- [x] **T2.2** 创建 `src/services/api.ts`（Axios 实例 + `X-Platform: web` Header + Request/Response 拦截器）
- [x] **T2.3** 实现 Access Token 过期 401 静默刷新逻辑（并发请求排队）
- [x] **T2.4** 创建 `src/services/auth.ts`（封装 login/register/refresh/me API）
- [x] **T2.5** 运行 `openapi-typescript` 生成 `src/types/api.ts`
- [x] **T2.6** 创建 `src/components/GlobalSpin.tsx`（认证恢复时的全局 Loading）
- [x] **T2.7** 创建 `src/components/RequireAuth.tsx`（路由守卫：未登录重定向 /login）

## 阶段三：页面开发

- [x] **T3.1** 创建 `src/layouts/LandingLayout.tsx`（顶部导航 + Footer）
- [x] **T3.2** 创建 `src/pages/landing/index.tsx`（Banner + 服务卡片 + 页脚占位）
- [x] **T3.3** 创建 `src/layouts/AuthLayout.tsx`（简洁居中布局，无侧边栏）
- [x] **T3.4** 创建 `src/pages/auth/LoginPage.tsx`（邮箱 + 密码表单 + 登录按钮 + 跳转注册）
- [x] **T3.5** 创建 `src/pages/auth/RegisterPage.tsx`（邮箱 + 密码 + 确认密码 + 注册按钮 + 注册成功后自动登录并跳转 `/dashboard`）
- [x] **T3.6** 创建 `src/layouts/BasicLayout.tsx`（侧边栏 + 顶部 Header + 内容区）
- [x] **T3.7** 创建 `src/pages/dashboard/index.tsx`（控制台占位页）
- [x] **T3.8** 创建 `src/pages/profile/index.tsx`（展示用户 email / role / 创建时间）
- [x] **T3.9** 配置 `src/App.tsx` 路由（landing / login / register / dashboard / profile）

## 阶段四：联调与验证

- [x] **T4.1** 启动后端 admission-api，确认接口可访问
- [x] **T4.2** 联调登录接口，验证 Token 存储和 Header 自动携带
- [x] **T4.3** 联调注册接口，验证错误处理（邮箱已存在等）及注册成功后自动登录跳转 `/dashboard`
- [x] **T4.4** 联调 /api/v1/me，验证个人信息展示
- [x] **T4.5** 测试 401 静默刷新：发现后端 refresh token 机制存在 Bug（后端返回 JWT 但 Redis 存储的是 raw token hash），前端拦截器逻辑正确
- [x] **T4.6** 测试认证恢复：关闭浏览器后重开，验证自动恢复登录态（需后端修复 refresh token 后完全验证）
- [x] **T4.7** 测试路由守卫：未登录访问 `/dashboard` 自动跳转 `/login`；已登录用户访问 `/login` 自动跳转 `/dashboard`
- [x] **T4.8** 测试登出：清除状态并跳转 /login

## 阶段五：收尾

- [x] **T5.1** 清理无用文件和代码（默认 Vite 模板残留）
- [x] **T5.2** 编写 README.md（项目说明 + 启动命令 + 环境变量说明）
- [ ] **T5.3** 提交代码