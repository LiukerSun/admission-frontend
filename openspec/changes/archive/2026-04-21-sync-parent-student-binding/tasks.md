## 1. 类型与 API 层更新

- [x] 1.1 重新生成 `src/types/api.ts`（`npm run typegen`），确保包含 `user_type`、`bindings` 相关 schema 和端点
- [x] 1.2 更新 `src/services/auth.ts`，注册请求体增加 `user_type` 字段
- [x] 1.3 新建 `src/services/bindings.ts`，封装 `POST /api/v1/bindings` 和 `GET /api/v1/bindings`
- [x] 1.4 验证 `src/services/api.ts` 的 interceptor 能正常处理绑定接口的 401/403 响应

## 2. 认证状态与用户模型更新

- [x] 2.1 更新 `src/stores/authStore.ts`，User 类型增加 `user_type: 'parent' | 'student'`
- [x] 2.2 更新 `authStore.login()` 和 `authStore.restore()`，确保 `/api/v1/me` 返回的 `user_type` 被正确写入 store
- [x] 2.3 更新 `authStore.register()`，调用时传入 `user_type`

## 3. 注册页更新

- [x] 3.1 在 `src/pages/auth/RegisterPage.tsx` 增加「我是家长 / 我是学生」Radio 单选组件
- [x] 3.2 注册表单校验：未选择用户类型时提示错误
- [x] 3.3 提交注册时把 `user_type` 随请求体发送

## 4. 绑定管理页面

- [x] 4.1 新建 `src/pages/bindings/index.tsx` 页面组件
- [x] 4.2 家长视角：展示「绑定学生」表单（输入学生邮箱 + 提交按钮）和已绑定学生列表
- [x] 4.3 学生视角：隐藏绑定表单，仅展示已绑定的家长信息
- [x] 4.4 空状态处理：无绑定关系时展示空状态提示
- [x] 4.5 错误处理：学生不存在、已被绑定等后端错误提示正确展示

## 5. 布局与导航更新

- [x] 5.1 更新 `src/layouts/BasicLayout.tsx`，Sidebar 增加「绑定管理」菜单项（路径 `/bindings`）
- [x] 5.2 「绑定管理」菜单项仅对 `user_type === 'parent'` 显示（或对所有认证用户显示，页面内再做条件渲染）
- [x] 5.3 在 `src/App.tsx` 的 router 配置中新增 `/bindings` 路由（使用 `BasicLayout` + `RequireAuth`）

## 6. 个人资料页更新

- [x] 6.1 更新 `src/pages/profile/index.tsx`，展示用户类型（家长 / 学生）

## 7. 验证与清理

- [x] 7.1 运行 TypeScript 类型检查（`npm run typecheck` 或 `tsc --noEmit`），确保无类型错误
- [x] 7.2 本地验证注册流程（家长 / 学生两种类型）
- [x] 7.3 本地验证绑定流程（家长绑定学生、学生查看绑定关系）
