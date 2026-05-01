import api from '@/services/api'
 
export type AssistantRole = 'user' | 'assistant'
 
export type AssistantMessage = {
  id: string
  role: AssistantRole
  content: string
  created_at: number
}
 
export type AssistantConversation = {
  id: string
  title: string
  updated_at: number
  messages: AssistantMessage[]
}
 
export type AssistantSendResult = {
  conversation_id: string
  reply: string
}
 
export async function sendAssistantMessage(params: {
  message: string
  conversation_id?: string
}): Promise<AssistantSendResult> {
  const res = await api.post('/api/v1/assistant/chat', {
    message: params.message,
    conversation_id: params.conversation_id,
  })
 
  const data = res.data?.data || res.data
  const conversationId = data?.conversation_id || data?.conversationId || params.conversation_id || ''
  const reply = data?.reply || data?.message || data?.content || ''
 
  if (!conversationId || !reply) {
    throw new Error('Invalid assistant response')
  }
 
  return { conversation_id: conversationId, reply }
}
