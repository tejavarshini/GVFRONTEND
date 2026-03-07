// api/contactApi.ts
// API for submitting contact form leads to backend

import axios from 'axios';

const BRAND_API_URL = import.meta.env.VITE_BRAND_API_URL || '';

export interface ContactLeadData {
  organizationName: string;
  city: string;
  state: string;
  pan: string;
  gst: string;
  message: string;
  role: 'corporate' | 'reseller' | 'distributor';
  sampleInvoiceFile?: File; // Optional file upload for corporate leads
}

export interface ContactLeadResponse {
  success: boolean;
  message: string;
}

/**
 * Submit a new contact lead (corporate, reseller, or distributor)
 * @param data - Contact lead data with role identifier
 * @param file - Optional file upload (for corporate invoice)
 * @returns Promise with success status and message
 */
export const submitContactLead = async (
  data: ContactLeadData
): Promise<ContactLeadResponse> => {
  try {
    // If there's a file, use FormData for multipart/form-data
    // Otherwise, send as JSON
    if (data.sampleInvoiceFile) {
      const formData = new FormData();
      
      // Append all form fields
      formData.append('organizationName', data.organizationName);
      formData.append('city', data.city);
      formData.append('state', data.state);
      formData.append('pan', data.pan);
      formData.append('gst', data.gst);
      formData.append('message', data.message);
      formData.append('role', data.role);
      
      // Append the file
      formData.append('sampleInvoice', data.sampleInvoiceFile);
      
      const response = await axios.post<ContactLeadResponse>(
        `${BRAND_API_URL}/v1/new-lead-contacts`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } else {
      // No file, send as JSON
      const { sampleInvoiceFile, ...jsonData } = data;
      
      const response = await axios.post<ContactLeadResponse>(
        `${BRAND_API_URL}/v1/new-lead-contacts`,
        jsonData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    }
  } catch (error) {
    console.error('Error submitting contact lead:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.message || 'Failed to submit contact form');
    }
    
    throw new Error('An unexpected error occurred while submitting the form');
  }
};
