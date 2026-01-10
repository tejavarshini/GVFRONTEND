// hooks/useEasebuzzInitiatePayment.ts
import { useMutation } from '@tanstack/react-query';

interface InitiatePaymentRequest {
  txnid: string;         
  amount: string;
  productinfo: string;
  firstname: string;
  phone: string;
  email: string;
  surl: string;
  furl: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  address2?: string;
  city?: string;
  state?: string;
}

interface InitiatePaymentResponse {
  status: "INITIATED" | "failed" | number;
  message: string;
  accessKey?: string; 
  data?: string;      
  paymentUrl?: string;
  txnid?: string;
  masterTransactionId?: string;
}

// ✅ Get API URL from environment
const API_BASE_URL = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:8080/api/v1';

export function useEasebuzzInitiatePayment() {
  return useMutation({
    mutationFn: async (request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> => {
      console.log("🌐 Calling API:", `${API_BASE_URL}/easebuzz/initiate`);
      
      const response = await fetch(`${API_BASE_URL}/easebuzz/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to initiate payment');
      }

      return response.json();
    },
  });
}
