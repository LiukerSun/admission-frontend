# Design: 前端项目架构

## 技术选型

| 类别 | 技术 | 理由 |
|------|------|------|
| 构建工具 | Vite 6 | 极速 HMR，ESM 原生支持，配置简洁 |
| 框架 | React 19 | 最新稳定版，并发特性 |
| 语言 | TypeScript 5.x | 类型安全，IDE 体验好 |
| 路由 | React Router 7 | 声明式路由，嵌套路由，loader/action 支持 |
| 组件库 | Ant Design 5 | 企业级成熟组件库，政府/央企项目标配 |
| 状态管理 | Zustand (latest) | 轻量，无 boilerplate，TypeScript 友好 |
| HTTP 客户端 | Axios | 拦截器生态成熟，自动处理 401 刷新队列 |
| API 类型 | openapi-typescript | 从后端 Swagger 自动生成类型，减少对接成本 |
| 图标 | @ant-design/icons | AntD 官方图标库 |

## 目录结构

```
admission-frontend/
├── public/                    # 静态资源
│   └── favicon.ico
├── src/
│   ├── main.tsx               # React 挂载点
│   ├── App.tsx                # 根组件 + 路由配置
│   ├── App.css                # 全局样式
│   ├── layouts/
│   │   ├── LandingLayout.tsx  # 首页布局（顶部导航 + 内容 + 页脚）
│   │   ├── AuthLayout.tsx     # 认证页布局（居中简洁布局）
│   │   └── BasicLayout.tsx    # 后台布局（侧边栏 + 顶部 Header + 内容区）
│   ├── pages/
│   │   ├── landing/
│   │   │   └── index.tsx      # Landing Page（Banner + 服务卡片 + 页脚）
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx  # 登录页
│   │   │   └── RegisterPage.tsx # 注册页
│   │   ├── dashboard/
│   │   │   └── index.tsx      # 控制台（基础占位）
│   │   └── profile/
│   │       └── index.tsx      # 个人中心（展示用户信息）
│   ├── components/
│   │   ├── RequireAuth.tsx    # 路由守卫：未登录重定向
│   │   └── GlobalSpin.tsx     # 全局 Loading 覆盖层
│   ├── services/
│   │   ├── api.ts             # Axios 实例 + 拦截器
│   │   └── auth.ts            # 认证相关 API 封装
│   ├── stores/
│   │   └── authStore.ts       # Zustand 认证状态
│   ├── types/
│   │   └── api.ts             # openapi-typescript 自动生成
│   └── utils/
│       └── constants.ts       # 常量（API base URL 等）
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── package.json
└── .env.example
```

## 认证架构

```
┌─────────────────────────────────────────────────────────────┐
│                      认证状态流转图                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  注册页                                                      │
│    │                                                        │
│    ▼                                                        │
│  POST /api/v1/auth/register                                 │
│    │                                                        │
│    ▼                                                        │
│  注册成功 → 自动调用 login（email + password）              │
│    │                                                        │
│    ▼                                                        │
│  获取 TokenPair → 跳转 /dashboard                           │
│    │                                                        │
│    ▼（若自动登录失败，回退至 /login）                       │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  登录页                                                      │
│    │                                                        │
│    ▼                                                        │
│  POST /api/v1/auth/login                                    │
│    │                                                        │
│    ▼                                                        │
│  authStore.login({ accessToken, refreshToken, user })       │
│    ├── accessToken  →  Zustand 内存                         │
│    ├── refreshToken →  localStorage                         │
│    └── user         →  Zustand 内存                         │
│                                                             │
│  后续请求                                                   │
│    │                                                        │
│    ▼                                                        │
│  Axios Request Interceptor:                                 │
│    Authorization: Bearer {accessToken}                      │
│    X-Platform: web                                          │
│                                                             │
│  Access Token 过期 (401)                                    │
│    │                                                        │
│    ▼                                                        │
│  Axios Response Interceptor:                                │
│    1. 检查是否在刷新中 → 是：排队原请求                     │
│    2. 否：调用 POST /api/v1/auth/refresh                    │
│    3. 刷新成功 → 更新内存 accessToken + localStorage refresh│
│    4. 重试排队请求                                          │
│    5. 刷新失败 → 清除所有状态 → 跳转 /login                │
│                                                             │
│  应用启动（浏览器重开）                                      │
│    │                                                        │
│    ▼                                                        │
│  App.tsx useEffect:                                         │
│    localStorage 有 refreshToken?                            │
│    ├── 是 → 调用 refresh → 成功：设置登录态                 │
│    └── 否 → 保持未登录                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### authStore 接口

```typescript
interface AuthState {
  accessToken: string | null;
  user: { id: number; email: string; role: string } | null;
  isAuthenticated: boolean;
  isRestoring: boolean;  // 认证恢复中（展示全局 Spin）

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restore: () => Promise<void>;  // 启动时调用
  setAccessToken: (token: string) => void;
}

// 所有认证相关请求自动注入 X-Platform header
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': 'web',
  },
});
```

## 路由设计

```typescript
// App.tsx 路由配置
const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingLayout />,
    children: [{ index: true, element: <LandingPage /> }],
  },
  {
    path: '/',
    element: <AuthLayout />,  // 无侧边栏，简洁布局
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/',
    element: <BasicLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
    ],
  },
]);
```

## API 类型同步流程

```bash
# package.json scripts 中添加
"typegen": "openapi-typescript ../admission-api/docs/swagger.yaml -o src/types/api.ts"

# 执行
npm run typegen
```

生成后的 `src/types/api.ts` 包含所有后端接口的请求/响应类型，供 `services/` 下的 API 封装使用。

## 主题配置（Ant Design）

企业级/政府央企风格主题：
- 主色：稳重蓝（`#1a5fb4` 或 AntD 默认蓝色微调）
- 圆角：小圆角（`border-radius: 4px`）
- 字体：系统默认 sans-serif（如需要可引入思源黑体）
- 布局：大留白，简洁克制

```typescript
// App.tsx 中包裹 ConfigProvider
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1a5fb4',
      borderRadius: 4,
    },
  }}
>
  <RouterProvider router={router} />
</ConfigProvider>
```

## 环境变量

```
# .env.example
VITE_API_BASE_URL=http://localhost:8080
```

生产环境通过构建时注入 `VITE_API_BASE_URL` 指向生产后端。