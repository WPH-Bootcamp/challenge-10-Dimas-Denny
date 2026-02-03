import { api } from "../../lib/api";
import { LoginPayLoad, LoginResponse } from "./types";

export async function loginUser(payload: LoginPayLoad) {
  const res = await api.post<LoginResponse>("/auth/login", payload);
  return res.data;
}
