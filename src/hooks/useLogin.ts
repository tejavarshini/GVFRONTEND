import { useMutation } from "@tanstack/react-query";
import { login } from "@/api/authApi";
import type { LoginRequest, LoginResponse, ValidationError } from "@/types/auth";
import { AxiosError } from "axios";

export const useLogin = () => {
  return useMutation<LoginResponse, AxiosError<ValidationError>, LoginRequest>({
    mutationFn: login,
  });
};
