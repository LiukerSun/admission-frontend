import api from './api'

interface CreateBindingRequest {
  student_email: string
}

export interface BindingWithUserDetail {
  id: number
  user: {
    id: number
    email: string
  }
  created_at: string
}

export interface BindingListResponse {
  user_type: 'parent' | 'student'
  bindings: BindingWithUserDetail[]
}

export const bindingsApi = {
  create: (data: CreateBindingRequest) =>
    api.post('/api/v1/bindings', data),

  list: () =>
    api.get('/api/v1/bindings'),
}
