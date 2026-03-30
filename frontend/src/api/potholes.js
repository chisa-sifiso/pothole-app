import client from './client'

export const reportPothole = (formData, onUploadProgress) =>
  client.post('/potholes/report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })

export const getAllReports = (params) =>
  client.get('/potholes', { params })

export const getMyReports = () =>
  client.get('/potholes/my')

export const getReportById = (id) =>
  client.get(`/potholes/${id}`)

export const getReportsByBoundingBox = (params) =>
  client.get('/potholes/map', { params })

export const verifyReport = (id) =>
  client.patch(`/potholes/${id}/verify`)
