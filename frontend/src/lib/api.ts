import axios from "axios";
import { API_BASE_URL } from "./constants";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// SWR fetcher using axios
export const fetcher = (url: string) =>
  apiClient.get(url).then((res) => res.data);
