import axios from "axios";
import type { SendOtpRequest, SendOtpResponse, VerifyOtpRequest, VerifyOtpResponse } from "@/types/otp";

const OTP_API_URL = "https://api.msg91.com/api/v5/widget/sendOtp";
const VERIFY_OTP_API_URL = "https://api.msg91.com/api/v5/widget/verifyOtp";
const WIDGET_ID = "3661676c6767343735313734";
const AUTH_KEY = "441109AdIRodg4B6932ec90P1";

export const sendOtp = async (mobileNumber: string): Promise<SendOtpResponse> => {
  const requestBody: SendOtpRequest = {
    widgetId: WIDGET_ID,
    identifier: `91${mobileNumber}`,
  };

  const response = await axios.post<SendOtpResponse>(OTP_API_URL, requestBody, {
    headers: {
      authkey: AUTH_KEY,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

// ADD THIS NEW FUNCTION:
export const verifyOtp = async (reqId: string, otp: string): Promise<VerifyOtpResponse> => {
  const requestBody: VerifyOtpRequest = {
    widgetId: WIDGET_ID,
    reqId: reqId,
    otp: otp,
  };

  const response = await axios.post<VerifyOtpResponse>(VERIFY_OTP_API_URL, requestBody, {
    headers: {
      authkey: AUTH_KEY,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};
