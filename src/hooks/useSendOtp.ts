import { useMutation } from "@tanstack/react-query";
import { sendOtp } from "@/api/otpApi";

export const useSendOtp = () => {
  return useMutation({
    mutationFn: (mobileNumber: string) => sendOtp(mobileNumber),
  });
};
