export interface SendOtpRequest {
  widgetId: string;
  identifier: string;
}

export interface SendOtpResponse {
  message: string;
  type: string;
}

// ADD THESE NEW INTERFACES:
export interface VerifyOtpRequest {
  widgetId: string;
  reqId: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string; // JWT token
  type: string;
}