import { axiosClient } from './axiosClient'
import type { ListingCard, ListingDetail, PagedResult } from '../types'

export interface ListingFilter {
  page?: number
  pageSize?: number
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  sortBy?: string
  sortOrder?: string
  status?: string
}

export interface CreateListingPayload {
  categoryId: string
  title: string
  description: string
  price: number
  stockQuantity: number
  deliveryInfo?: string
  tags?: string[]
}

export const listingsApi = {
  getList: (filter: ListingFilter = {}) =>
    axiosClient.get<PagedResult<ListingCard>>('/listings', { params: filter }),
  getById: (id: string) => axiosClient.get<ListingDetail>(`/listings/${id}`),
  getMy: (page = 1, pageSize = 20) =>
    axiosClient.get<PagedResult<ListingCard>>('/listings/my', { params: { page, pageSize } }),
  create: (payload: CreateListingPayload) => axiosClient.post<ListingDetail>('/listings', payload),
  uploadImages: (id: string, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return axiosClient.post<ListingDetail>(`/listings/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  update: (id: string, payload: CreateListingPayload) =>
    axiosClient.put<ListingDetail>(`/listings/${id}`, payload),
  updateStatus: (id: string, status: string) =>
    axiosClient.patch<ListingDetail>(`/listings/${id}/status`, { status }),
  remove: (id: string) => axiosClient.delete(`/listings/${id}`),
}
