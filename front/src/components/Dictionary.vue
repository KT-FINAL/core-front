<template>
  <div class="dictionary-panel" :class="{ 'is-open': isOpen }">
    <div class="dictionary-header">
      <h3>사전</h3>
      <button @click="$emit('close')" class="close-btn">×</button>
    </div>

    <div v-if="loading" class="dictionary-loading">
      <div class="loading-spinner"></div>
      <p>단어 검색 중...</p>
    </div>

    <div v-else-if="error" class="dictionary-error">
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="retry-btn">다시 시도</button>
    </div>

    <div v-else-if="!selectedWord" class="dictionary-empty">
      <p>PDF에서 텍스트를 선택하면 여기에 단어의 뜻이 표시됩니다.</p>
    </div>

    <div v-else class="dictionary-content">
      <div class="word-header">
        <h2 class="word">{{ selectedWord }}</h2>
        <div v-if="wordData.phonetic" class="phonetic">{{ wordData.phonetic }}</div>
        <div class="language-tag">{{ isKorean ? "한국어" : "영어" }}</div>
      </div>

      <div v-if="wordData.meanings && wordData.meanings.length > 0" class="meanings">
        <div v-for="(meaning, index) in wordData.meanings" :key="index" class="meaning-item">
          <p class="part-of-speech">{{ meaning.partOfSpeech }}</p>
          <ul class="definitions">
            <li v-for="(def, defIndex) in meaning.definitions" :key="defIndex" class="definition">
              {{ def.definition }}
              <p v-if="def.example" class="example"><strong>예시:</strong> {{ def.example }}</p>
            </li>
          </ul>
        </div>
      </div>

      <div v-else class="no-definition">
        <p>정의를 찾을 수 없습니다.</p>
      </div>

      <div class="dictionary-footer">
        <button @click="saveWord" class="save-btn">단어장에 저장</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "WordDictionary",
  props: {
    selectedWord: {
      type: String,
      default: "",
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    bookId: {
      type: String,
      default: "",
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      wordData: {},
      loading: false,
      error: null,
    };
  },
  computed: {
    isKorean() {
      // Simple check for Korean characters
      return /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(this.selectedWord);
    },
  },
  watch: {
    selectedWord(newWord) {
      if (newWord) {
        this.fetchDefinition(newWord);
      } else {
        this.wordData = {};
      }
    },
  },
  methods: {
    async fetchDefinition(word) {
      this.loading = true;
      this.error = null;

      try {
        // In a real implementation, this would call an API
        // For now, we'll create a placeholder structure that would be replaced with API data
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API delay

        // Create a simplified structure that can be replaced with real API data later
        if (this.isKorean) {
          this.wordData = {
            phonetic: null,
            meanings: [
              {
                partOfSpeech: "정보",
                definitions: [
                  {
                    definition: "이 기능은 API 연결 시 실제 사전 데이터로 교체될 예정입니다.",
                    example: null,
                  },
                ],
              },
            ],
          };
        } else {
          this.wordData = {
            phonetic: `/${word}/`,
            meanings: [
              {
                partOfSpeech: "정보",
                definitions: [
                  {
                    definition: "이 기능은 API 연결 시 실제 사전 데이터로 교체될 예정입니다.",
                    example: null,
                  },
                ],
              },
            ],
          };
        }

        this.loading = false;
      } catch (err) {
        console.error("Error fetching definition:", err);
        this.error = "단어 정의를 가져오는 중 오류가 발생했습니다.";
        this.loading = false;
      }
    },

    // Remove the mock data methods and replace with simplified versions
    getMockKoreanDefinition() {
      return null; // This will be replaced by API call
    },

    getMockEnglishDefinition() {
      return null; // This will be replaced by API call
    },

    saveWord() {
      // Create a vocabulary entry
      const vocabEntry = {
        word: this.selectedWord,
        language: this.isKorean ? "ko" : "en",
        phonetic: this.wordData.phonetic,
        definition: this.wordData.meanings,
        bookId: this.bookId,
        page: this.pageNumber,
        timestamp: new Date().toISOString(),
      };

      // Get existing vocabulary from localStorage
      let vocabulary = [];
      try {
        const savedVocabulary = localStorage.getItem("vocabulary");
        if (savedVocabulary) {
          vocabulary = JSON.parse(savedVocabulary);
        }
      } catch (error) {
        console.error("Error loading vocabulary:", error);
      }

      // Add new entry
      vocabulary.push(vocabEntry);

      // Save back to localStorage
      localStorage.setItem("vocabulary", JSON.stringify(vocabulary));

      // Show confirmation
      alert(`"${this.selectedWord}"가 단어장에 추가되었습니다.`);
    },
  },
};
</script>

<style scoped>
.dictionary-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 350px;
  height: 100%;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  font-family: "Noto Sans KR", sans-serif;
}

.dictionary-panel.is-open {
  right: 0;
}

.dictionary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.dictionary-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ff5252;
}

.dictionary-loading,
.dictionary-error,
.dictionary-empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
  flex-grow: 1;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff5252;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.retry-btn {
  background-color: #fff2b2;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin-top: 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #ffe980;
}

.dictionary-content {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.word-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.word {
  margin: 0 0 5px 0;
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.phonetic {
  color: #666;
  font-size: 16px;
  margin-bottom: 8px;
}

.language-tag {
  display: inline-block;
  padding: 4px 8px;
  background-color: #f5f5f5;
  color: #666;
  border-radius: 4px;
  font-size: 14px;
}

.meanings {
  flex-grow: 1;
}

.meaning-item {
  margin-bottom: 20px;
}

.part-of-speech {
  font-size: 16px;
  color: #666;
  font-style: italic;
  margin: 0 0 8px 0;
}

.definitions {
  padding-left: 20px;
  margin: 0;
}

.definition {
  margin-bottom: 10px;
  line-height: 1.5;
}

.example {
  margin: 5px 0 0 0;
  padding-left: 15px;
  font-size: 14px;
  color: #666;
  border-left: 2px solid #eee;
}

.no-definition {
  text-align: center;
  color: #666;
  padding: 20px 0;
}

.dictionary-footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.save-btn {
  width: 100%;
  background-color: #fff2b2;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background-color: #ffe980;
}
</style>
