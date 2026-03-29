import client from './client'

export const generateRFQ  = (potholeId, data) => client.post(`/rfqs/generate/${potholeId}`, data)
export const getAllRFQs   = ()               => client.get('/rfqs')
export const getRFQById   = (id)             => client.get(`/rfqs/${id}`)
export const getBids      = (rfqId)          => client.get(`/rfqs/${rfqId}/bids`)
export const submitBid    = (rfqId, data)    => client.post(`/rfqs/${rfqId}/bid`, data)
export const awardBid     = (rfqId, bidId)   => client.post(`/rfqs/${rfqId}/award/${bidId}`)
