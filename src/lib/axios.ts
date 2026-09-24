import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = "https://dummyjson.com";

const TOKEN_KEY = "auth_token";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  public status?: number;
  public data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const onRequest = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const onRequestError = (error: AxiosError): Promise<AxiosError> => {
  return Promise.reject(error);
};

const onResponse = (response: AxiosResponse): AxiosResponse => {
  return response;
};

const onResponseError = (error: AxiosError): Promise<never> => {
  let message = "Something went wrong. Please try again.";
  let status: number | undefined;
  let data: unknown;

  if (error.response) {
    status = error.response.status;
    data = error.response.data;

    if (status === 401) {
      message = "Session expired. Please log in again.";
      if (typeof window !== "undefined") {
        clearToken();
      }
    } else if (status === 400) {
      message =
        (data as { message?: string })?.message || "Invalid request.";
    } else if (status === 404) {
      message = "Resource not found.";
    } else if (status >= 500) {
      message = "Server error. Please try again later.";
    } else {
      message =
        (data as { message?: string })?.message ||
        error.message ||
        message;
    }
  } else if (error.request) {
    message = "Network error. Please check your connection.";
  } else {
    message = error.message || message;
  }

  const apiError = new ApiError(message, status, data);
  return Promise.reject(apiError);
};

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(onRequest, onRequestError);
axiosInstance.interceptors.response.use(onResponse, onResponseError);

export default axiosInstance;
