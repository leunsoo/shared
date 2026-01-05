import type { AxiosRequestConfig } from "axios";

interface ApiConfig {
  baseURL: string;
  timeout: {
    default: number;
  };
  headers: AxiosRequestConfig["headers"];
}

const apiConfig: ApiConfig = {
  baseURL: "baseURL",

  timeout: {
    default: 5000, // 5초
  },

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

export const getApiConfig = (): Readonly<ApiConfig> => ({ ...apiConfig });
