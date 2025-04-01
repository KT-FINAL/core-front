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
          <!-- Word and part of speech -->
          <div v-if="wordAnalysis.part_of_speech" class="part-of-speech">
            <span class="pos-tag">{{ wordAnalysis.part_of_speech }}</span>
            <span v-if="wordAnalysis.origin" class="origin-tag">{{ wordAnalysis.origin }}</span>
          </div>

          <!-- Definitions -->
          <div
            v-if="wordAnalysis.definitions && wordAnalysis.definitions.length > 0"
            class="definitions"
          >
            <h4>의미:</h4>
            <ul>
              <li v-for="(def, index) in wordAnalysis.definitions" :key="index">
                {{ def }}
              </li>
            </ul>
          </div>

          <!-- Usage Example -->
          <div v-if="wordAnalysis.usage_example" class="example">
            <h4>예문:</h4>
            <p class="example-text">{{ wordAnalysis.usage_example }}</p>
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
    handleSave() {
      const selectionData = {
        bookId: this.actualBookInfo.id,
        bookTitle: this.actualBookInfo.title,
        author: this.actualBookInfo.author,
        pageNumber: this.actualPage,
        selectedText: this.actualText,
        contextParagraph: this.actualContext,
        timestamp: new Date().toISOString(),
      };

      this.$emit("save", selectionData);
    },
    async analyzeWord() {
      if (!this.actualText || this.actualText.trim().length === 0) {
        alert("선택된 텍스트가 없습니다.");
        return;
      }

      this.isAnalysisLoading = true;
      this.wordAnalysis = null;

      try {
        // Use publisher from book info if available
        const publisher = this.actualBookInfo.publisher || "문학수첩";

        // Use the real API with mode: 'cors' and additional headers to handle CORS
        const response = await fetch("http://4.230.153.71/analyze-word", {
          method: "POST",
          mode: "cors", // Explicitly set CORS mode
          credentials: "omit", // Don't send cookies
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            book_title: this.actualBookInfo.title || "해리포터와 마법사의 돌",
            publisher: publisher,
            paragraph: this.actualContext || "",
            word: this.actualText.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
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
  }

  .error-message {
    color: #ff0000;
    font-weight: 500;
    text-align: center;
    padding: 10px;
  }

  .example {
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
