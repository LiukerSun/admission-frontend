import { Alert, Form, Select, Typography } from 'antd'

const { Paragraph } = Typography

// Major-preference tag inputs. Field names map 1:1 with backend Preferences:
//   required_majors  →  AI hard-includes
//   preferred_majors →  AI soft-sorts higher
//   excluded_majors  →  AI hard-excludes
//   excluded_keywords→  AI hard-excludes (free-form keyword match)
//
// We surface only Chinese labels in the UI. The user can type any value; the
// service layer enforces ≤16 items × ≤32 chars.
export default function MajorPreferencesSection() {
  return (
    <Form.Item noStyle>
      <Paragraph type="secondary" style={{ marginTop: 0 }}>
        告诉 AI 你的专业取向。「必学」会被严格筛选，「感兴趣」只参与排序，「不想学 / 排除关键词」会被剔除。
      </Paragraph>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="区分三种意图"
        description={
          <div>
            <div><strong>必学专业方向</strong>：候选池里不包含这些关键词的都会被剔除。</div>
            <div><strong>感兴趣专业</strong>：不会缩小候选池，只把符合的院校排前面。</div>
            <div><strong>不想学的专业 / 排除关键词</strong>：直接排除，避免出现在推荐里。</div>
          </div>
        }
      />

      <Form.Item label="必学专业方向" name={['preferences', 'required_majors']}>
        <Select
          mode="tags"
          placeholder="例如：计算机、软件、电子信息（每输入一项按回车）"
          tokenSeparators={[',', '，', ' ']}
          maxTagCount={16}
        />
      </Form.Item>

      <Form.Item label="感兴趣专业" name={['preferences', 'preferred_majors']}>
        <Select
          mode="tags"
          placeholder="例如：人工智能、机器学习"
          tokenSeparators={[',', '，', ' ']}
          maxTagCount={16}
        />
      </Form.Item>

      <Form.Item label="不想学的专业" name={['preferences', 'excluded_majors']}>
        <Select
          mode="tags"
          placeholder="例如：生化环材、机械、土木"
          tokenSeparators={[',', '，', ' ']}
          maxTagCount={16}
        />
      </Form.Item>

      <Form.Item label="排除关键词" name={['preferences', 'excluded_keywords']} style={{ marginBottom: 0 }}>
        <Select
          mode="tags"
          placeholder="比专业名更模糊的关键词，例如：师范、农林"
          tokenSeparators={[',', '，', ' ']}
          maxTagCount={16}
        />
      </Form.Item>
    </Form.Item>
  )
}
