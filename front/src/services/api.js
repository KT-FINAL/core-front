import axios from "axios";

const api = axios.create({
  baseURL: "http://20.249.202.164",
  headers: {
    "Content-Type": "application/json",
  },
});

// 토큰이 있는 경우 헤더에 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
      // 로그인 성공 시 토큰을 localStorage에 저장
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getUserInfo: async () => {
    try {
      const response = await api.get("/api/v1/user/info");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const vocabularyService = {
  // 단어장 목록 조회
  getVocabularyList: async () => {
    try {
      const response = await api.get("/api/v1/vocabulary");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 단어 저장
  saveWord: async (wordData) => {
    try {
      const response = await api.post("/api/v1/vocabulary", wordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 단어 삭제
  deleteWord: async (wordId) => {
    try {
      const response = await api.delete(`/api/v1/vocabulary/${wordId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default api;
