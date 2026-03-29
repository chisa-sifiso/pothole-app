import client from './client'

export const getProfile    = ()     => client.get('/contractors/profile')
export const updateProfile = (data) => client.put('/contractors/profile', data)
