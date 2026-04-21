## Context

当前前端已具备基础认证能力（注册、登录、自动刷新 Token、受保护路由），但尚未支持后端最新完成的「家长-学生绑定」功能：
- 注册时无法选择用户类型；
- 用户模型不含 `user_type`；
- 没有任何绑定关系相关的 UI 或服务。

后端接口已就绪（`/api/v1/bindings` 等），Swagger 文档已更新。

## Goals / Non-Goals

**Goals:**
- 注册流程增加 `user_type` 选择，并在注册成功后正确保存用户类型。
- 用户模型和 auth store 中增加 `user_type`，供全局条件渲染使用。
- 新增绑定管理页面：家长可发起绑定，所有用户可查看绑定关系。
- 重新生成 `src/types/api.ts`，与后端 Swagger 完全对齐。
- 在 Sidebar 中根据 `user_type === 'parent'` 显示「绑定管理」入口。

**Non-Goals:**
- 管理后台（admin 解绑页面）不在本次范围内；普通用户无权解绑，因此前端暂不提供解绑按钮。
- 不修改 JWT 解析逻辑（仅利用 Axios interceptor 中已有的 token 管理）。
- 不修改登录页 UI（仅修改注册页）。

## Decisions

1. **用户类型选择器放在注册页**（而非登录后引导）
   - 原因：后端注册接口要求 `user_type`，无法后补。放在注册页可以减少一步引导流程。
   - 替代方案：注册后弹窗引导选择类型。但后端不支持无类型的注册，故否决。

2. **绑定管理使用独立页面 `/bindings`**
   - 原因：绑定关系有自己的 CRUD 语义（目前主要是查询和创建），独立页面比弹窗更清晰。
   - 路由放在 BasicLayout 下，仅对认证用户开放。

3. **绑定服务独立为 `src/services/bindings.ts`**
   - 原因：绑定是独立业务域，与 `auth.ts` 解耦便于后续扩展（如解绑、批量导入）。

4. **`user_type` 从 `/api/v1/me` 获取并写入 store**
   - 原因：虽然 JWT claims 中也有 `user_type`，但前端直接解析 JWT 需要引入 base64 解码逻辑；通过 `/api/v1/me` 获取更可靠，且与现有登录/恢复流程一致。

5. **API types 使用 `openapi-typescript` 重新生成**
   - 原因：项目已配置 `npm run typegen`，保持类型与后端 Swagger 的单一数据源。

## Risks / Trade-offs

- **[Risk]** 注册增加字段可能降低转化率 → **Mitigation**: 使用 Radio 单选按钮，默认不选中，强制用户主动选择，文案用「我是家长 / 我是学生」降低认知成本。
- **[Risk]** 后端 `user_type` 为枚举字符串，前端若传错值会导致 400 → **Mitigation**: TypeScript 类型约束 + 表单校验确保只传 `"parent" | "student"`。
- **[Trade-off]** 学生视角下绑定页面只能查看家长信息，不能发起绑定。UI 上需要条件渲染「发起绑定」表单。

## Migration Plan

无需数据迁移。本次变更纯前端侧，部署后新注册用户即具备 `user_type`。老用户（若存在）在后端已被默认设为 `student`。

## Open Questions

- 家长绑定学生后，学生是否需要在 UI 上收到通知？当前后端绑定是即时生效、无需确认，因此前端暂不做通知机制。
