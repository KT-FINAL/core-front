<template>
  <div class="text-selection-panel" v-if="isOpen">
    <div class="panel-header">
      <h3>선택한 텍스트</h3>
      <button @click="$emit('close')" class="close-button">×</button>
    </div>

    <div class="selection-content">
      <div class="book-metadata">
        <p>책: {{ actualBookInfo.title }}</p>
        <p>저자: {{ actualBookInfo.author }}</p>
        <p>페이지: {{ actualPage }}</p>
      </div>

      <div class="selected-text">
        <h4>선택 텍스트:</h4>
        <p class="highlight">{{ actualText }}</p>
      </div>

      <div class="context-paragraph">
        <h4>문장 맥락:</h4>
        <p>{{ actualContext }}</p>
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
      // Empty data object, no longer needed since we removed notes and tags
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
  },
};
</script>

<style scoped lang="scss">
.text-selection-panel {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 380px;
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
  padding: 15px;
  background-color: #fff2b2;
  border-bottom: 1px solid #e0e0e0;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;

    &:hover {
      color: #333;
    }
  }
}

.selection-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.book-metadata {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;

  p {
    margin: 5px 0;
    color: #666;
    font-size: 14px;
  }
}

.selected-text {
  margin-bottom: 20px;

  h4 {
    margin: 0 0 10px;
    color: #333;
    font-size: 16px;
    font-weight: 500;
  }

  .highlight {
    background-color: #fff2b2;
    padding: 10px;
    border-radius: 4px;
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
  }
}

.context-paragraph {
  margin-bottom: 20px;

  h4 {
    margin: 0 0 10px;
    color: #333;
    font-size: 16px;
    font-weight: 500;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #555;
    background-color: #f9f9f9;
    padding: 10px;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
  }
}

.panel-actions {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  border-top: 1px solid #e0e0e0;
  background-color: #f9f9f9;

  button {
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    border: none;
    transition: all 0.2s;

    &.save-button {
      background-color: #fff2b2;
      color: #333;

      &:hover {
        background-color: #ffeb99;
      }
    }

    &.cancel-button {
      background-color: #f1f1f1;
      color: #666;

      &:hover {
        background-color: #e5e5e5;
      }
    }
  }
}
</style>
