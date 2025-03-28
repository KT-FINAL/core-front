import axios from "axios";

const api = axios.create({
  baseURL: "https://4dda-222-99-179-19.ngrok-free.app",
  headers: {
    "Content-Type": "application/json",
  },
});

export const userService = {
  register: async (userData) => {
    try {
      const response = await api.post("/api/v1/user/register", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  login: async (credentials) => {
    try {
      const response = await api.post("/api/v1/user/login", credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default api;
