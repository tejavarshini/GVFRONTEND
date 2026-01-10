// src/api/guardRails.api.ts
import axios, { AxiosError } from 'axios';
import type { Brand, ClientUsageRequest } from '@/types/guardRails';

const API_BASE_URL = import.meta.env.VITE_BRAND_API_URL || 'http://localhost:8080';

// Define error response type
interface ApiErrorResponse {
  message: string;
  code?: string;
  status?: number;
}

export const guardRailsApi = {
  /**
   * Fetches all brands with their guard rail configurations
   */
  async getBrands(): Promise<Brand[]> {
    try {
      const response = await axios.post<Brand[]>(
        `${API_BASE_URL}/guard-rails/brands`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        throw new Error(
          axiosError.response?.data?.message || 'Failed to fetch brands'
        );
      }
      throw new Error('An unexpected error occurred');
    }
  },

  /**
   * Fetches client usage for specific brand
   */
  async getClientUsage(payload: ClientUsageRequest): Promise<number> {
    try {
      const response = await axios.post<number>(
        `${API_BASE_URL}/guard-rails/client-usage`,
        payload
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        throw new Error(
          axiosError.response?.data?.message || 'Failed to fetch client usage'
        );
      }
      throw new Error('An unexpected error occurred');
    }
  },
};
