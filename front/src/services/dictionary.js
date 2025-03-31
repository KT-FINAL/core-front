/**
 * Dictionary Service
 * Provides methods to interact with dictionary APIs for word definitions
 */

import axios from "axios";

// Free Dictionary API (public API)
const FREE_DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en";

// API endpoints (to be implemented on your backend)
const KOREAN_DICTIONARY_ENDPOINT = "/api/dictionary/korean";
const ENGLISH_KOREAN_DICTIONARY_ENDPOINT = "/api/dictionary/english-korean";

/**
 * Service for dictionary-related API calls
 */
export default {
  /**
   * Get Korean word definition (Korean-Korean dictionary)
   * @param {string} word - The Korean word to look up
   * @returns {Promise<Object>} - Definition response
   */
  async getKoreanDefinition(word) {
    try {
      // In actual implementation, this would call your backend API
      // which would then call a service like NAVER Dictionary API
      const response = await axios.get(
        `${KOREAN_DICTIONARY_ENDPOINT}?word=${encodeURIComponent(word)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching Korean definition:", error);
      // Return a placeholder definition for development
      return this.getKoreanPlaceholderDefinition(word);
    }
  },

  /**
   * Get English word definition in Korean (English-Korean dictionary)
   * @param {string} word - The English word to look up
   * @returns {Promise<Object>} - Definition response
   */
  async getEnglishToKoreanDefinition(word) {
    try {
      // First try to use the Free Dictionary API (English definitions)
      const response = await axios.get(`${FREE_DICTIONARY_API}/${encodeURIComponent(word)}`);

      if (response.data && response.data.length > 0) {
        // Transform the response to include a Korean translation placeholder
        // (In a real implementation, you would use a translation API here)
        return this.transformFreeDictionaryResponse(response.data[0], word);
      }

      throw new Error("Word not found in dictionary");
    } catch (error) {
      console.error("Error fetching English-Korean definition:", error);

      // If the public API fails, try your backend API (if it exists)
      try {
        const backendResponse = await axios.get(
          `${ENGLISH_KOREAN_DICTIONARY_ENDPOINT}?word=${encodeURIComponent(word)}`
        );
        return backendResponse.data;
      } catch (backendError) {
        console.error("Backend API also failed:", backendError);
        // Return a placeholder definition for development
        return this.getEnglishToKoreanPlaceholderDefinition(word);
      }
    }
  },

  /**
   * Transform Free Dictionary API response to match our expected format
   * @param {Object} data - The API response data
   * @param {string} word - The original word
   * @returns {Object} - Transformed response
   */
  transformFreeDictionaryResponse(data, word) {
    const meanings = [];

    // Process each meaning from the API
    if (data.meanings && data.meanings.length > 0) {
      data.meanings.forEach((meaning) => {
        const definitions = meaning.definitions.map((def) => ({
          definition: def.definition,
          example: def.example || null,
          // Add a placeholder Korean translation
          koreanTranslation: `(한국어 번역이 필요합니다)`,
        }));

        meanings.push({
          partOfSpeech: meaning.partOfSpeech,
          definitions: definitions,
        });
      });
    }

    // Add phonetics if available
    let phoneticText = "";
    if (data.phonetics && data.phonetics.length > 0) {
      for (const phonetic of data.phonetics) {
        if (phonetic.text) {
          phoneticText = phonetic.text;
          break;
        }
      }
    }

    return {
      word: word,
      phonetic: phoneticText,
      meanings: meanings,
    };
  },

  /**
   * Placeholder for Korean definition (for development)
   * @param {string} word - The Korean word
   * @returns {Object} - Placeholder definition
   */
  getKoreanPlaceholderDefinition(word) {
    return {
      word: word,
      meanings: [
        {
          partOfSpeech: "명사",
          definitions: [
            {
              definition: "한국어 사전 API 연결이 필요합니다. 이 메시지는 플레이스홀더입니다.",
              example: `예: ${word}는 한국어 단어입니다.`,
            },
          ],
        },
      ],
    };
  },

  /**
   * Placeholder for English-to-Korean definition (for development)
   * @param {string} word - The English word
   * @returns {Object} - Placeholder definition
   */
  getEnglishToKoreanPlaceholderDefinition(word) {
    return {
      word: word,
      meanings: [
        {
          partOfSpeech: "영영사전",
          definitions: [
            {
              definition: `"${word}"의 한국어 뜻: 영한사전 API 연결이 필요합니다.`,
              example: `Example: This is an example of the word "${word}".`,
            },
          ],
        },
      ],
    };
  },
};
