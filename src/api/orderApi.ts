import { giftcardApiClient } from "@/lib/valuedesignApi";
import type { OrderRequest, OrderResponse } from "@/types/cart";
import type { OrdersResponse } from "@/types/order";
import type { FetchCouponsRequest, FetchCouponsResponse } from "@/types/coupon";

export const createOrder = async (
  orderData: OrderRequest
): Promise<OrderResponse> => {
  const response = await giftcardApiClient.post("/orders", orderData);
  return response.data;
};

export const fetchOrders = async (
  clientId: string
): Promise<OrdersResponse> => {
  const response = await giftcardApiClient.post(`/orders/json/${clientId}`);
  return response.data;
};

export const updateOrderStatus = async (
  orderNumber: string,
  status: "PAID" | "FAILED"
): Promise<string> => {
  const response = await giftcardApiClient.post(`/orders/status`, {
    encryptedData: orderNumber,
    status: status,
  });
  return response.data;
};

export const fetchCoupons = async (
  request: FetchCouponsRequest
): Promise<FetchCouponsResponse> => {
  const response = await giftcardApiClient.post("/coupons/fetch", request);
  return response.data;
};
