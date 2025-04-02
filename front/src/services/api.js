import axios from "axios";

const api = axios.create({
  baseURL: "http://20.249.185.13",
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

  // 단어장에서 무작위로 단어 가져오기
  async getRandomWords(count = 5) {
    try {
      const response = await api.get("/api/v1/vocabulary");
      const words = response.data;
      // 무작위로 count개만큼 단어 선택
      const shuffled = words.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count).map((word) => word.word);
    } catch (error) {
      console.error("단어 가져오기 에러:", error);
      throw error;
    }
  },

  // AI 이야기 생성
  async createStory(words) {
    try {
      const response = await fetch("http://localhost:8000/ai/create-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ words }),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("AI 이야기 생성 에러:", error);
      throw error;
    }
  },
};

export default api;
