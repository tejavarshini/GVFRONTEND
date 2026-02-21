import axios from "axios";
import type { SignupRequest, LoginRequest, LoginResponse, LogoutRequest, ForgotPasswordRequest, ForgotPasswordResponse, ValidateTokenRequest, ValidateTokenResponse, ResetPasswordRequest, ResetPasswordResponse, LoginWithOtpRequest } from "@/types/auth";

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL;

export const signup = async (data: SignupRequest): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, data);
    return response.data; // Returns "Signup successful"
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      throw new Error(error.response.data);
    }
    throw error; 
  }
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post(`${API_BASE_URL}/login`, data);
  return response.data;
};

// ADD THIS NEW FUNCTION:
export const loginWithOtp = async (data: LoginWithOtpRequest): Promise<LoginResponse> => {
  const response = await axios.post(`${API_BASE_URL}/otp/login`, data);
  return response.data;
};

export const logout = async (data: LogoutRequest): Promise<string> => {
  const response = await axios.post(`${API_BASE_URL}/logout`, data);
  return response.data; // Returns "Logout successful"
};

export const forgotPassword = async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
  const response = await axios.post(`${API_BASE_URL}/forgot-password`, data);
  return response.data;
};

export const validateResetToken = async (data: ValidateTokenRequest): Promise<ValidateTokenResponse> => {
  const response = await axios.post(`${API_BASE_URL}/forgot-password/validate`, data);
  return response.data;
};

// ✅ Add reset password API
export const resetPassword = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  const response = await axios.post(`${API_BASE_URL}/forgot-password/reset`, data);
  return response.data;
};