## Why

Landing Page 的主 CTA 按钮目前固定显示"立即注册"，无论用户是否已登录。已登录用户看到"立即注册"按钮会产生困惑，且无法通过该按钮快速进入工作台，体验不连贯。

## What Changes

- Landing Page Hero 区域的 CTA 按钮根据用户认证状态动态切换：
  - 未登录：显示"立即注册"，点击跳转 `/register`
  - 已登录：显示"进入工作台"，点击跳转 `/dashboard`
- 按钮状态跟随 `authStore` 的 `isAuthenticated` 状态自动更新

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

（无）

## Impact

- `src/pages/landing/index.tsx`：引入 `useAuthStore` 读取认证状态，条件渲染按钮文案与跳转路径
