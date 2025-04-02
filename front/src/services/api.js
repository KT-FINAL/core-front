import axios from "axios";

export const BASE_URL = "http://20.249.185.13";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 토큰이 있는 경우 헤더에 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !config.url.includes("/api/v1/user/login")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Function to parse JWT token and extract user information
function parseJwtToken(token) {
  if (!token) return null;

  try {
    // JWT tokens are in format: header.payload.signature
    // We need the payload (second part)
    const base64Payload = token.split(".")[1];
    // Replace potential URL-unsafe characters and decode
    const payload = JSON.parse(atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/")));
    console.log("Decoded JWT payload:", payload);
    return payload;
  } catch (e) {
    console.error("Error parsing JWT token:", e);
    return null;
  }
}

// Helper function to extract member ID from token payload
function extractMemberIdFromPayload(payload) {
  if (!payload) return null;

  // Common ID field names in JWT tokens
  const possibleIdFields = ["id", "memberId", "userId", "user_id", "member_id", "jti"];

  // First, try to find a numeric ID
  let extractedId = null;

  // Look for numeric fields first
  for (const field of possibleIdFields) {
    if (payload[field] && !isNaN(parseInt(payload[field], 10))) {
      extractedId = parseInt(payload[field], 10);
      console.log(`Found numeric user ID in token field '${field}': ${extractedId}`);
      return extractedId;
    }
  }

  // If no numeric ID found, check if 'sub' field contains an email and try to extract a numeric ID
  if (payload.sub && typeof payload.sub === "string") {
    // If sub contains an email with a numeric prefix like '123@example.com'
    const emailMatch = payload.sub.match(/^(\d+)@/);
    if (emailMatch && emailMatch[1]) {
      extractedId = parseInt(emailMatch[1], 10);
      console.log(`Extracted numeric ID from email in 'sub' field: ${extractedId}`);
      return extractedId;
    }
  }

  // Return null if no valid numeric ID found
  return null;
}

export const userService = {
  register: async (userData) => {
    try {
      console.log("Sending registration request with data:", {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        passwordProvided: !!userData.password,
      });

      const response = await api.post("/api/v1/user/register", userData);
      console.log("Registration API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Registration error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error.response?.data || { message: error.message };
    }
  },
  login: async (credentials) => {
    try {
      console.log("Attempting login with credentials:", {
        email: credentials.email,
        passwordProvided: !!credentials.password,
      });
      const response = await api.post("/api/v1/user/login", credentials);

      // Validate login response contains required fields
      if (!response.data) {
        console.error("Login API returned no data");
        throw new Error("로그인 서버에서 응답이 없습니다.");
      }

      // 로그인 성공 시 토큰을 localStorage에 저장
      if (response.data.token) {
        console.log("Login successful, storing token");
        localStorage.setItem("token", response.data.token);

        // If ID is missing but we have a token, try to extract ID from the token
        if (!response.data.id) {
          console.log("No user ID in response, attempting to extract from token");
          const tokenPayload = parseJwtToken(response.data.token);

          if (tokenPayload) {
            // Try to extract a numeric ID from the token payload
            const memberId = extractMemberIdFromPayload(tokenPayload);

            if (memberId) {
              response.data.id = memberId; // Already numeric from extraction function
              console.log("Successfully extracted numeric ID from token:", memberId);
            } else {
              console.warn("Could not extract valid numeric ID from token");
            }
          }
        } else if (typeof response.data.id === "string") {
          // If ID is provided as string, convert to number
          const numericId = parseInt(response.data.id, 10);
          if (!isNaN(numericId)) {
            response.data.id = numericId;
            console.log("Converted string ID to number:", numericId);
          } else {
            console.error("ID from backend is not a valid numeric string:", response.data.id);
          }
        }
      } else {
        console.warn("Login successful but no token was returned");
      }

      // Final check for ID
      if (!response.data.id) {
        console.error(
          "Login API response missing user ID and could not extract from token:",
          response.data
        );
        throw new Error("로그인 응답에 사용자 ID가 없습니다. 관리자에게 문의해주세요.");
      }

      // Ensure ID is a number
      if (typeof response.data.id !== "number") {
        console.error("User ID is not a number after processing:", response.data.id);
        throw new Error("사용자 ID가 올바른 형식이 아닙니다. 관리자에게 문의해주세요.");
      }

      console.log("Login response ID:", response.data.id);
      return response.data;
    } catch (error) {
      console.error("Login error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // For 500 errors, provide a more specific error
      if (error.response?.status === 500) {
        throw {
          message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          serverError: true,
        };
      }

      throw error.response?.data || { message: error.message };
    }
  },
  getUserInfo: async () => {
    try {
      const response = await api.get("/api/v1/user/info");

      // Validate the response data
      const userData = response.data;
      if (!userData || !userData.id) {
        console.error("getUserInfo: API returned invalid or incomplete user data:", userData);
        throw new Error("Invalid user data received");
      }

      return userData;
    } catch (error) {
      console.error("Error getting user info:", error);
      throw error.response?.data || error.message;
    }
  },
};

export const paymentService = {
  saveBilling: async (billingData) => {
    try {
      const response = await api.post("/payments/billing", billingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  savePayment: async (memberId) => {
    try {
      const response = await api.post("/payments", { memberId });
      return response.data;
    } catch (error) {
      console.error("Payment saving error:", error);
      return { success: false, error: error.message };
    }
  },
};

export const subscriptionService = {
  getAllSubscriptions: async (memberId) => {
    // Validate memberId before making the API call
    if (typeof memberId !== "number") {
      console.warn("Invalid memberId type for getAllSubscriptions (expected number):", memberId);
      return [];
    }

    try {
      const response = await api.get(`/api/v1/subscription/all/${memberId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`구독 정보 조회 오류 (memberId: ${memberId}):`, error);
      // Return empty array to continue the flow
      return [];
    }
  },

  getActiveSubscription: async (memberId) => {
    // Validate memberId before making the API call
    if (typeof memberId !== "number") {
      console.warn("Invalid memberId type for getActiveSubscription (expected number):", memberId);
      return { id: null, active: false };
    }

    try {
      console.log(`Checking active subscription for memberId: ${memberId}`);
      const response = await api.get(`/api/v1/subscription/${memberId}`);
      return response.data || { id: null, active: false };
    } catch (error) {
      console.error(`활성 구독 정보 조회 오류 (memberId: ${memberId}):`, error);

      // Do NOT assume subscription is active on server error - always return inactive status
      // This ensures new users are properly directed to the subscription page
      return { id: null, active: false };
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
      const response = await fetch(`${BASE_URL}/ai/create-story`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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

export const wordAnalysisService = {
  async analyzeWord(word, bookTitle, publisher, paragraph) {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log("API 요청 헤더:", headers);
      console.log("API 요청 URL:", `${BASE_URL}/ai/analyze-word`);
      const response = await fetch(`${BASE_URL}/ai/analyze-word`, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: headers,
        body: JSON.stringify({
          book_title: bookTitle || "해리포터와 마법사의 돌",
          publisher: publisher || "문학수첩",
          paragraph: paragraph || "",
          word: word.trim(),
        }),
      });
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("단어 분석 중 오류 발생:", error);
      throw error;
    }
  },
};

export default api;
