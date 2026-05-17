import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Progress,
  Space,
  Typography,
  Upload,
  message,
} from 'antd'
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { adminApi, type BackupRestoreResult } from '@/services/admin'

const { Title, Paragraph, Text } = Typography
const { Dragger } = Upload

function suggestedFilename(disposition?: string): string {
  if (!disposition) return `admission-${Date.now()}.dump`
  // 形如：attachment; filename="admission-20260515-100000.dump"
  const match = disposition.match(/filename="([^"]+)"/)
  return match?.[1] ?? `admission-${Date.now()}.dump`
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export default function AdminBackupPage() {
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [lastResult, setLastResult] = useState<BackupRestoreResult | null>(null)
  const [restoreError, setRestoreError] = useState('')

  async function handleExport() {
    setExporting(true)
    try {
      const res = await adminApi.exportBackup()
      const blob = res.data as unknown as Blob
      const filename = suggestedFilename(res.headers?.['content-disposition'])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      message.success(`已导出 ${filename}（${formatBytes(blob.size)}）`)
    } catch (err) {
      message.error('导出失败，请查看后端日志')
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const uploadProps: UploadProps = {
    name: 'backup',
    multiple: false,
    accept: '.dump',
    maxCount: 1,
    showUploadList: false,
    beforeUpload: async (file) => {
      // 上传 + 恢复合并到 beforeUpload 里，因为 antd 的 customRequest 也行但要写更多
      // 模板代码；这里直接接管。返回 false 阻止 antd 自动上传到默认 action。
      setRestoreError('')
      setLastResult(null)
      setUploadPercent(0)
      setRestoring(true)
      try {
        const res = await adminApi.restoreBackup(file as File, setUploadPercent)
        const data = res.data.data
        setLastResult(data)
        message.success(`已从 ${data.filename} 恢复数据库`)
      } catch (err) {
        const m = err instanceof Error ? err.message : '恢复失败'
        // axios 错误体里的后端 message 优先
        const apiMessage =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setRestoreError(apiMessage || m)
        message.error('恢复失败，详情见下方')
      } finally {
        setRestoring(false)
      }
      return false
    },
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 4, fontSize: 24 }}>
        数据库备份与恢复
      </Title>
      <Text type="secondary">
        全库导出 / 恢复使用 pg_dump custom 压缩格式（.dump）。恢复时会先 DROP
        现有对象再写入，建议在维护窗口操作。
      </Text>

      <Card title="导出备份" style={{ marginTop: 24 }} extra={<CloudDownloadOutlined />}>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          点击按钮下载当前数据库快照（含 schema + 全部数据），文件名形如
          <Text code>admission-YYYYMMDD-HHMMSS.dump</Text>。
        </Paragraph>
        <Button
          type="primary"
          icon={<CloudDownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
        >
          {exporting ? '正在导出…' : '导出备份'}
        </Button>
      </Card>

      <Card title="从备份恢复" style={{ marginTop: 24 }} extra={<CloudUploadOutlined />}>
        <Alert
          type="warning"
          showIcon
          message="恢复会清空并覆盖当前数据库"
          description="操作不可逆。建议先用上方「导出备份」留一份当前快照再继续。"
          style={{ marginBottom: 16 }}
        />
        <Dragger {...uploadProps} disabled={restoring}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽 .dump 文件到此处</p>
          <p className="ant-upload-hint">仅接受 pg_dump custom-format 文件（单个，≤1 GiB）</p>
        </Dragger>

        {restoring && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">上传进度</Text>
            <Progress percent={uploadPercent} status="active" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              上传完成后后端开始执行 pg_restore，可能需要几分钟，请勿关闭页面。
            </Text>
          </div>
        )}

        {lastResult && !restoring && (
          <Alert
            type="success"
            showIcon
            style={{ marginTop: 16 }}
            message={`恢复完成：${lastResult.filename}（${formatBytes(lastResult.size_bytes)}）`}
            description={
              lastResult.stderr_tail ? (
                <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                  <Text type="secondary">pg_restore stderr（仅供核对，含警告时正常）：</Text>
                  <pre
                    style={{
                      background: '#F5F5F5',
                      padding: 8,
                      borderRadius: 4,
                      maxHeight: 200,
                      overflow: 'auto',
                      fontSize: 12,
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                    }}
                  >
                    {lastResult.stderr_tail}
                  </pre>
                </Space>
              ) : null
            }
          />
        )}

        {restoreError && !restoring && (
          <Alert
            type="error"
            showIcon
            style={{ marginTop: 16 }}
            message="恢复失败"
            description={
              <pre
                style={{
                  background: '#FFF1F0',
                  padding: 8,
                  borderRadius: 4,
                  maxHeight: 200,
                  overflow: 'auto',
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}
              >
                {restoreError}
              </pre>
            }
          />
        )}
      </Card>
    </div>
  )
}
