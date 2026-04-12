import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";


const TOKEN_KEY = "sn_access_token";

export const http = axios.create({
  baseURL: "https://localhost:7248", 
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      // očisti auth
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
