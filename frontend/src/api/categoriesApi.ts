import { axiosClient } from './axiosClient'
import type { CategoryTree } from '../types'

export const categoriesApi = {
  getTree: () => axiosClient.get<CategoryTree[]>('/categories'),
}
