## Context

当前 dashboard 页面（`BasicLayout`）左上角的 logo 是纯展示元素，没有交互行为。用户需要一种快捷方式从 dashboard 返回 landing page。

## Goals / Non-Goals

**Goals:**
- 点击左上角 logo 导航至 landing page (`/`)
- 保持原有 UI 样式不变

**Non-Goals:**
- 修改 logo 的样式或外观
- 添加 hover/active 状态之外的交互反馈
- 在其他 layout 中添加相同行为

## Decisions

- **使用 `navigate()` 而非 `<a>` 标签**：项目已使用 React Router，`useNavigate` hook 更适合 SPA 导航
- **仅修改 `BasicLayout`**：需求明确限定为 dashboard 界面的 logo 点击行为

## Risks / Trade-offs

- 无显著风险，变更范围极小
