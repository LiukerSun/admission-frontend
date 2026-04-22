# 志愿报考分析平台前端

基于 Vite + React 19 + TypeScript + Ant Design 5 的企业级前端项目。

## 技术栈

- **构建工具**: Vite 6
- **框架**: React 19 + TypeScript
- **路由**: React Router 7
- **组件库**: Ant Design 5
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **API 类型**: openapi-typescript（从后端 Swagger 自动生成）
- **API 规范**: OpenSpec（spec-driven 开发流程）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://localhost:8080` |

复制 `.env.example` 为 `.env` 并根据需要修改。

## 功能特性

- **用户认证** — 邮箱密码登录、注册、Token 自动刷新、登出
- **身份类型** — 注册时支持选择"家长"或"学生"身份
- **家长-学生绑定** — 家长可发起绑定，查看已绑定的学生（反之亦然）
- **响应式导航** — 控制台侧边栏导航，支持 Logo 点击返回首页
- **路由守卫** — 认证状态自动重定向（未登录用户访问受保护路由跳转登录页）

## 项目结构

```
src/
├── components/          # 全局共享组件
├── layouts/             # 布局组件
├── pages/               # 页面组件
│   ├── landing/         # 首页
│   ├── auth/            # 登录/注册
│   ├── dashboard/       # 控制台
│   ├── profile/         # 个人中心
│   └── bindings/        # 家长-学生绑定管理
├── services/            # API 客户端
├── stores/              # Zustand 状态管理
├── types/               # 自动生成 API 类型
└── utils/               # 工具函数
```

## 开发规范

本项目使用 [OpenSpec](openspec/) 进行 spec-driven 开发，每个功能变更通过以下流程管理：

1. **Propose** — 创建变更提案，明确问题与范围
2. **Design** — 技术设计，确定实现方案
3. **Specs** — 编写功能规格（需求 + 场景）
4. **Tasks** — 拆分为可执行任务
5. **Apply** — 实施并验证

## API 类型同步

当后端 Swagger 文档更新时，重新生成类型：

```bash
npm run typegen
```

## 后端依赖

- 后端服务: [admission-api](https://github.com/LiukerSun/admission-api)
- 默认地址: `http://localhost:8080`
- 需要 Redis 运行（Refresh Token 存储）


