import { Button } from './Button'

/**
 * Button examples
 *
 * Demonstrates the normalized variants, semantic tones, radius tokens, opacity,
 * and the Ant Design passthrough escape hatch.
 */
export function ButtonExamples() {
  return (
    <div>
      <Button>Submit</Button>
      <Button variant="secondary" radius="lg">
        取消
      </Button>
      <Button variant="ghost" opacity={0.65}>
        透明操作
      </Button>
      <Button tone="danger" radius="pill">
        删除
      </Button>
      <Button loading size="lg">
        保存中
      </Button>
      <Button antProps={{ block: true }} variant="text">
        通栏文本操作
      </Button>
    </div>
  )
}
