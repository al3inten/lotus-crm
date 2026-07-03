import { axiosClient } from "./axiosClient";
import type { User } from "../types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await axiosClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await axiosClient.get<User>("/auth/me");
  return data;
}
