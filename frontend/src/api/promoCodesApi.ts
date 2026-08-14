import { axiosClient } from './axiosClient'
import type { CreatePromoCodePayload, PromoCode, RedeemPromoCodeResult } from '../types'

export const promoCodesApi = {
  getAll: () => axiosClient.get<PromoCode[]>('/promocodes'),
  create: (payload: CreatePromoCodePayload) => axiosClient.post<PromoCode>('/promocodes', payload),
  disable: (id: string) => axiosClient.patch<PromoCode>(`/promocodes/${id}/disable`),
  redeem: (code: string) => axiosClient.post<RedeemPromoCodeResult>('/promocodes/redeem', { code }),
}
