import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("shopezToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getErrorMessage = (error) => {
  return error.response?.data?.message || error.message || "Something went wrong";
};

export default api;

