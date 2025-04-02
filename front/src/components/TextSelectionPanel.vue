<template>
  <div class="text-selection-panel" v-if="isOpen">
    <div class="panel-header">
      <h3>단어 정보</h3>
      <button @click="$emit('close')" class="close-button">×</button>
    </div>

    <div class="selection-content">
      <div class="selected-text">
        <h4>선택한 단어:</h4>
        <p class="highlight">{{ actualText }}</p>
      </div>

      <div v-if="isAnalysisLoading" class="loading-indicator">
        <div class="spinner"></div>
        <p>분석 중...</p>
      </div>

      <div v-if="wordAnalysis && !isAnalysisLoading" class="word-meaning">
        <div v-if="typeof wordAnalysis === 'string'" class="error-message">
          {{ wordAnalysis }}
        </div>
        <div v-else>
          <!-- Meaning -->
          <div v-if="wordAnalysis.meaning" class="definitions">
            <h4>의미:</h4>
            <p>{{ wordAnalysis.meaning }}</p>
          </div>

          <!-- Examples -->
          <div v-if="wordAnalysis.examples && wordAnalysis.examples.length > 0" class="example">
            <h4>예문:</h4>
            <ul>
              <li
                v-for="(example, index) in wordAnalysis.examples"
                :key="index"
                class="example-text"
              >
                {{ example }}
              </li>
            </ul>
          </div>

          <!-- Synonyms -->
          <div v-if="wordAnalysis.synonyms" class="synonyms">
            <h4>유의어:</h4>
            <p>{{ wordAnalysis.synonyms }}</p>
          </div>

          <!-- Antonyms -->
          <div v-if="wordAnalysis.antonyms" class="antonyms">
            <h4>반의어:</h4>
            <p>{{ wordAnalysis.antonyms }}</p>
          </div>

          <!-- Related words -->
          <div v-if="wordAnalysis.related_words" class="related-words">
            <h4>관련 단어:</h4>
            <p>{{ wordAnalysis.related_words }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-actions">
      <button @click="handleSave" class="save-button">저장하기</button>
      <button @click="$emit('close')" class="cancel-button">취소</button>
    </div>
  </div>
</template>

<script>
import { vocabularyService, wordAnalysisService } from "@/services/api";
import { ElMessage } from "element-plus";

export default {
  name: "TextSelectionPanel",
  props: {
    // For backward compatibility with original implementation
    selection: {
      type: Object,
      default: null,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    // New props for direct passing
    selectedText: {
      type: String,
      default: "",
    },
    contextParagraph: {
      type: String,
      default: "",
    },
    bookInfo: {
      type: Object,
      default: () => ({}),
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
  },
  computed: {
    // Compute actual values from either source
    actualText() {
      return this.selectedText || (this.selection ? this.selection.text : "");
    },
    actualContext() {
      return this.contextParagraph || (this.selection ? this.selection.paragraph : "");
    },
    actualBookInfo() {
      return Object.keys(this.bookInfo).length > 0
        ? this.bookInfo
        : this.selection
        ? this.selection.bookInfo
        : { title: "", author: "" };
    },
    actualPage() {
      return this.pageNumber || (this.selection ? this.selection.page : 1);
    },
  },
  data() {
    return {
      wordAnalysis: null,
      isAnalysisLoading: false,
    };
  },
  methods: {
    async handleSave() {
      if (!this.wordAnalysis || typeof this.wordAnalysis === "string") {
        ElMessage.error("단어 분석이 완료되지 않았습니다.");
        return;
      }

      try {
        const wordData = {
          word: this.actualText,
          meaning: this.wordAnalysis.meaning || "",
          example: this.wordAnalysis.examples?.[0] || "",
          antonym: this.wordAnalysis.antonyms || "",
          synonym: this.wordAnalysis.synonyms || "",
        };

        await vocabularyService.saveWord(wordData);
        ElMessage.success("단어가 저장되었습니다.");
        // 저장 후 입력 필드 초기화
        this.$emit("wordSaved", wordData);
        this.wordAnalysis = null;
        this.isAnalysisLoading = false;
      } catch (error) {
        console.error("단어 저장 에러:", error);
        ElMessage.error("단어 저장에 실패했습니다.");
      }
    },
    async analyzeWord() {
      if (!this.actualText || this.actualText.trim().length === 0) {
        alert("선택된 텍스트가 없습니다.");
        return;
      }

      this.isAnalysisLoading = true;
      this.wordAnalysis = null;

      try {
        const data = await wordAnalysisService.analyzeWord(
          this.actualText,
          this.actualBookInfo.title,
          this.actualBookInfo.publisher,
          this.actualContext
        );
        console.log("API 응답:", data);
        this.wordAnalysis = data;
      } catch (error) {
        console.error("단어 분석 중 오류 발생:", error);
        this.wordAnalysis = `분석 중 오류가 발생했습니다: ${error.message}`;

        // If we get a CORS error, show a specific message
        if (error.message.includes("Failed to fetch")) {
          this.wordAnalysis =
            "CORS 오류: API 서버에 접근할 수 없습니다. 서버 측에서 CORS 설정이 필요합니다.";
        }
      } finally {
        this.isAnalysisLoading = false;
      }
    },
  },
  mounted() {
    // Automatically analyze word when component is mounted
    this.analyzeWord();
  },
  watch: {
    selectedText: {
      handler(newText) {
        if (newText && newText.trim().length > 0) {
          this.analyzeWord();
        }
      },
      immediate: true,
    },
  },
};
</script>

<style scoped lang="scss">
.text-selection-panel {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 300px;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 10;
  overflow: hidden;
  animation: slide-in 0.3s ease;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #fff2b2;
  border-bottom: 1px solid #e0e0e0;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;

    &:hover {
      color: #333;
    }
  }
}

.selection-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.selected-text {
  margin-bottom: 20px;

  h4 {
    margin: 0 0 8px;
    color: #333;
    font-size: 15px;
    font-weight: 500;
  }

  .highlight {
    background-color: #fff2b2;
    padding: 10px;
    border-radius: 4px;
    margin: 0 0 10px 0;
    font-size: 18px;
    line-height: 1.5;
    font-weight: bold;
    text-align: center;
  }
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  margin: 20px 0;

  .spinner {
    width: 30px;
    height: 30px;
    margin-bottom: 15px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}

.word-meaning {
  .part-of-speech {
    margin-bottom: 10px;

    .pos-tag {
      background-color: #e0e0e0;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .origin-tag {
      background-color: #f0f0f0;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 5px;
    }
  }

  .definitions {
    h4 {
      margin: 0 0 10px;
      color: #333;
      font-size: 15px;
      font-weight: 500;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 10px;
        font-size: 14px;
        line-height: 1.5;
      }
    }

    p {
      margin: 0 0 15px;
      line-height: 1.5;
      font-size: 14px;
      background-color: #f9f9f9;
      padding: 10px;
      border-radius: 4px;
    }
  }

  .error-message {
    color: #ff0000;
    font-weight: 500;
    text-align: center;
    padding: 10px;
  }

  .example {
    margin-bottom: 15px;

    h4 {
      margin: 0 0 10px;
      color: #333;
      font-size: 15px;
      font-weight: 500;
    }

    .example-text {
      background-color: #f0f0f0;
      padding: 10px;
      border-radius: 4px;
      margin: 0 0 10px 0;
      font-size: 14px;
      line-height: 1.5;
    }

    ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
  }

  .synonyms,
  .antonyms,
  .related-words {
    margin-bottom: 15px;

    h4 {
      margin: 0 0 10px;
      color: #333;
      font-size: 15px;
      font-weight: 500;
    }

    p {
      background-color: #eef7ff;
      padding: 8px 12px;
      border-radius: 4px;
      margin: 0;
      font-size: 14px;
      display: inline-block;
    }
  }

  .antonyms p {
    background-color: #ffeeee;
  }

  .related-words p {
    background-color: #f0f7ed;
  }
}

.panel-actions {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background-color: #f9f9f9;

  button {
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    border: none;
    transition: all 0.2s;

    &.save-button {
      background-color: #fff2b2;
      color: #333;
      flex: 1;
      margin-right: 8px;

      &:hover {
        background-color: #ffeb99;
      }
    }

    &.cancel-button {
      background-color: #f1f1f1;
      color: #666;
      flex: 1;

      &:hover {
        background-color: #e5e5e5;
      }
    }
  }
}
</style>
