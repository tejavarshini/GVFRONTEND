import { useMutation } from "@tanstack/react-query";
import { signup } from "@/api/authApi";
import type { SignupRequest, ValidationError } from "@/types/auth";
import { AxiosError } from "axios";

export const useSignup = () => {
  return useMutation<string, AxiosError<ValidationError>, SignupRequest>({
    mutationFn: signup,
  });
};
