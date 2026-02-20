import { useMutation } from "@tanstack/react-query";
import { sendLoginOtp } from "@/api/otpApi";

/** Send OTP for login (POST /auth/login/send-otp). */
export const useSendOtp = () => {
  return useMutation({
    mutationFn: (mobileNumber: string) => sendLoginOtp(mobileNumber),
  });
};
