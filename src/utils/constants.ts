// VITE_API_BASE_URL 优先；未设置时：
//   - dev (vite serve) 默认走本机 8080 上的 admission-api
//   - prod build 默认走相对路径，由前端 nginx / 反向代理（caddy）路由 /api
// 之前 `||` 让 ARG VITE_API_BASE_URL= 的空串也回退到 localhost:8080，导致 docker
// 构建出来的镜像在线上仍打 localhost:8080。
const explicit = import.meta.env.VITE_API_BASE_URL
export const API_BASE_URL =
  explicit && explicit.length > 0
    ? explicit
    : import.meta.env.DEV
      ? 'http://localhost:8080'
      : ''
