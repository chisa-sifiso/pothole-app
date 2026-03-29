import client from './client'

export const getMyTasks = () =>
  client.get('/repairs/my')

export const getAllTasks = () =>
  client.get('/repairs')

export const startRepair = (taskId) =>
  client.patch(`/repairs/${taskId}/start`)

export const completeRepair = (taskId, formData) =>
  client.post(`/repairs/${taskId}/complete`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
