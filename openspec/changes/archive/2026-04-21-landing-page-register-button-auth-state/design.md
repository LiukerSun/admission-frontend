## Context

Landing Page Hero 区域当前使用硬编码的"立即注册"按钮，未感知用户认证状态。项目已具备 `useAuthStore`（基于 Zustand）管理全局认证状态，包含 `isAuthenticated` 标志位。

## Goals / Non-Goals

**Goals:**
- 已登录用户在 Landing Page 看到"进入工作台"按钮，点击跳转 Dashboard
- 未登录用户保持现有"立即注册"按钮，点击跳转注册页

**Non-Goals:**
- 修改 Landing Page 其他模块
- 修改认证逻辑或状态管理实现

## Decisions

- **使用 `useAuthStore` 而非手动读取 localStorage**：保持与现有组件（`RequireAuth`、`NoAuth`）一致的认证状态消费方式，避免重复解析 token 逻辑
- **仅变更按钮文案与导航路径，不引入新组件**：改动范围最小化，复用现有 `Button` + `useNavigate`

## Risks / Trade-offs

- `[Risk]` 认证状态恢复期间（`isRestoring === true`）按钮可能短暂闪烁 → `Mitigation`: 由 `AppInitializer` 的全局 loading 层拦截，Landing Page 渲染时状态已就绪
