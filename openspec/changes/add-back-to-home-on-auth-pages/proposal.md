## Why

当前登录和注册页面缺少返回首页的导航入口，用户在认证流程中无法便捷地回到首页了解产品信息或放弃登录/注册。增加返回首页的入口可以改善用户体验，提供清晰的退出路径。

## What Changes

- 在登录页面 (`/login`) 增加返回首页的链接或按钮
- 在注册页面 (`/register`) 增加返回首页的链接或按钮
- 确保视觉风格与现有认证页面保持一致

## Capabilities

### New Capabilities
<!-- 无新增 capability -->

### Modified Capabilities
- `user-auth`: 登录和注册页面的界面需求增加"返回首页"导航入口

## Impact

- 受影响的文件：`src/pages/auth/LoginPage.tsx`、`src/pages/auth/RegisterPage.tsx`
- 无 API 变更、无依赖变更、无系统影响
