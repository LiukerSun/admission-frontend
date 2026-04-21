## Why

后端已完成家长-学生绑定功能的全部实现（包括账号类型区分、绑定关系管理、JWT 注入用户类型），但前端目前仍仅支持基础的邮箱/密码注册与登录，无法选择用户类型，也无法查看或管理绑定关系。为了与后端能力对齐，必须同步更新前端。

## What Changes

- **BREAKING**:注册流程必须增加 `user_type` 字段，用户需选择"家长"或"学生"身份。
- **BREAKING**:用户模型增加 `user_type`（`parent` | `student`），影响 `authStore`、`/api/v1/me` 调用及所有依赖用户信息的组件。
- 新增「绑定管理」页面：家长可输入学生邮箱发起绑定；所有登录用户可查看自己的绑定关系。
- 更新 `src/types/api.ts`，重新生成以包含绑定相关端点和更新后的 User 模型。
- 在 BasicLayout 中根据 `user_type` 条件展示「绑定管理」入口。
- 新增 `src/services/bindings.ts` 封装绑定相关 API。

## Capabilities

### New Capabilities
- `parent-student-binding`: 家长-学生账号绑定与绑定关系查询。

### Modified Capabilities
- `user-auth`: 注册和用户信息查询的 schema 增加 `user_type` 字段；JWT claims 中需携带 `user_type`。

## Impact

- `src/pages/auth/RegisterPage.tsx` — 注册表单增加用户类型选择。
- `src/stores/authStore.ts` — 用户模型增加 `user_type`。
- `src/services/auth.ts` — 注册请求体类型更新。
- `src/services/bindings.ts` — 新增绑定服务文件。
- `src/types/api.ts` — 重新生成 OpenAPI types。
- `src/layouts/BasicLayout.tsx` — 增加绑定管理导航入口（仅家长可见）。
- `src/pages/bindings/` — 新增绑定管理页面。
