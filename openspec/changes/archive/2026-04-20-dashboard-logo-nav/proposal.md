## Why

当前 dashboard 页面左上角的 logo 不可点击，用户无法通过 logo 返回 landing page。这是常见的网页导航模式，提升用户体验和操作便利性。

## What Changes

- 在 `src/layouts/BasicLayout.tsx` 中，将左上角 logo 区域添加点击事件，点击后导航至 landing page (`/`)

## Capabilities

### New Capabilities
- `logo-navigation`: Logo 点击导航至 landing page

### Modified Capabilities
- 无

## Impact

- `src/layouts/BasicLayout.tsx`: 修改 logo 组件，添加 `onClick` 导航事件
- 无 API 变更，无依赖变更
