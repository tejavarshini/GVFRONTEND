import { useMutation } from "@tanstack/react-query";
import { sendLoginOtp } from "@/api/otpApi";

export const useSendOtp = () => {
  return useMutation({
    mutationFn: (params: { mobileNumber: string; email?: string }) => sendLoginOtp(params),
  });
};