import axiosInstance from "@/lib/axios";
import { LoginRequest, User } from "@/types";

export const login = async (credentials: LoginRequest): Promise<User> => {
  const { data } = await axiosInstance.post<User>("/auth/login", {
    username: credentials.username,
    password: credentials.password,
    expiresInMins: 60,
  });
  return data;
};

export const getCurrentUser = async (): Promise<User> => {
  const { data } = await axiosInstance.get<User>("/auth/me");
  return data;
};
