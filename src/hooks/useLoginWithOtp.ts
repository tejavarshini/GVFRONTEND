import { useMutation } from "@tanstack/react-query";
import { loginWithOtp } from "@/api/authApi";
import type { LoginWithOtpRequest } from "@/types/auth";

export const useLoginWithOtp = () => {
  return useMutation({
    mutationFn: (data: LoginWithOtpRequest) => loginWithOtp(data),
  });
};
