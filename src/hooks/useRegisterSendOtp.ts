import { useMutation } from "@tanstack/react-query";
import { registerSendOtp } from "@/api/otpApi";

export const useRegisterSendOtp = () => {
  return useMutation({
    mutationFn: (mobileNumber: string) => registerSendOtp(mobileNumber),
  });
};
