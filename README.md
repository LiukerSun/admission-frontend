# AI志愿填报助手前端

基于 Vite + React 19 + TypeScript + Ant Design 6 的企业级前端项目。

## 技术栈

- **构建工具**: Vite 6
- **框架**: React 19 + TypeScript
- **路由**: React Router 7
- **组件库**: Ant Design 6
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **数据可视化**: ECharts
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

### 用户端
- **用户认证** — 邮箱密码登录、注册、Token 自动刷新、登出
- **身份类型** — 注册时支持选择"家长"或"学生"身份
- **家长-学生绑定** — 家长可发起绑定，查看已绑定的学生（反之亦然）
- **数据分析** — 院校分数线趋势、专业薪资对比、志愿模拟（冲稳保漏斗）、一分一段表
- **数据导出** — 分析结果支持导出 CSV

### 管理端
- **统计看板** — 平台用户数据概览，带趋势迷你图
- **用户管理** — 用户列表、搜索筛选、批量启用/禁用、CSV 导出、重置密码
- **绑定管理** — 查看和解绑家长-学生关系

### 界面与交互
- **可折叠侧边栏** — 支持展开/收起，适配小屏
- **面包屑导航** — 顶部路径导航，支持点击跳转
- **全局搜索** — Header 搜索框，快速定位功能
- **通知中心** — 系统消息提醒
- **快捷入口** — 常用功能一键直达

## 项目结构

```
src/
├── components/          # 全局共享组件
├── layouts/             # 布局组件
│   ├── AuthLayout.tsx   # 认证页布局
│   ├── BasicLayout.tsx  # 控制台布局（侧边栏 + Header + 面包屑）
│   └── LandingLayout.tsx # 落地页布局
├── pages/               # 页面组件
│   ├── landing/         # 首页
│   ├── auth/            # 登录/注册
│   ├── dashboard/       # 控制台（KPI 卡片 + 迷你趋势图）
│   ├── analysis/        # 数据分析（ECharts 多图表）
│   ├── profile/         # 个人中心
│   ├── bindings/        # 家长-学生绑定管理
│   └── admin/           # 管理后台
│       ├── AdminDashboardPage.tsx  # 统计看板
│       ├── AdminUsersPage.tsx      # 用户管理
│       └── AdminBindingsPage.tsx   # 绑定管理
├── services/            # API 客户端
├── stores/              # Zustand 状态管理
├── types/               # 自动生成 API 类型
└── utils/               # 工具函数
```

## 设计系统

本项目使用数据密集型仪表板风格（Data-Dense Dashboard），配色和字体规范如下：

| 角色 | 色值 |
|------|------|
| 主色 | `#1E40AF` |
| 辅色 | `#3B82F6` |
| 强调 | `#D97706` |
| 背景 | `#F8FAFC` |
| 成功 | `#16A34A` |
| 危险 | `#DC2626` |

- **正文字体**: Fira Sans
- **圆角**: 6px
- **间距系统**: 基于 4px/8px 增量

## 开发规范

本项目使用 [OpenSpec](openspec/) 进行 spec-driven 开发，每个功能变更通过以下流程管理：

1. **Propose** — 创建变更提案，明确问题与范围
2. **Design** — 技术设计，确定实现方案
3. **Specs** — 编写功能规格（需求 + 场景）
4. **Tasks** — 拆分为可执行任务
5. **Apply** — 实施并验证

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 运行单元测试 |
| `npm run check` | 顺序执行 lint + test + build |
| `npm run typegen` | 根据后端 Swagger 重新生成 API 类型 |

## API 类型同步

当后端 Swagger 文档更新时，重新生成类型：

```bash
npm run typegen
```

## 后端依赖

- 后端服务: [admission-api](https://github.com/LiukerSun/admission-api)
- 默认地址: `http://localhost:8080`
- 需要 Redis 运行（Refresh Token 存储）
