// hooks/useEasebuzzInitiatePayment.ts
import { useMutation } from '@tanstack/react-query';

interface InitiatePaymentRequest {
  sabbpe_token: string;
  amount: number;
  productinfo: string;
  frontend_url: string;
  encrypted_order_ref: string;
  customer: {
    firstname: string;
    email: string;
    phone: string;
  };
}

interface InitiatePaymentResponse {
  status: boolean | number;
  data?: string;
  accessKey?: string;
  transaction_id?: string;
  merchant_order_ref?: string;
  payment_url?: string;
  gateway?: string;
  txnid?: string;
  initiation_status?: string;
  message?: string;
}

// SabbPe Wrapper API URL
const SABBPE_API_URL = "https://pymntsuat.sabbpe.com";

export function useEasebuzzInitiatePayment() {
  return useMutation({
    mutationFn: async (request: any): Promise<InitiatePaymentResponse> => {
      console.log("🌐 Calling SabbPe wrapper API:", `${SABBPE_API_URL}/sabbpe/v1/initiate`);
      
      const response = await fetch(`${SABBPE_API_URL}/sabbpe/v1/initiate`, {
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
