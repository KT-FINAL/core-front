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

      <div class="notes-section">
        <h4>메모:</h4>
        <textarea v-model="notes" placeholder="이 구절에 대한 메모를 입력하세요..."></textarea>
      </div>

      <div class="tags-section">
        <h4>태그:</h4>
        <div class="tags-input">
          <input
            v-model="newTag"
            @keyup.enter="addTag"
            placeholder="태그 입력 후 Enter..."
            ref="tagInput"
          />
          <button @click="addTag" class="add-tag-button">추가</button>
        </div>
        <div class="tags-list">
          <span v-for="(tag, index) in tags" :key="index" class="tag">
            {{ tag }}
            <button @click="removeTag(index)" class="remove-tag">×</button>
          </span>
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
      notes: "",
      tags: [],
      newTag: "",
    };
  },
  methods: {
    addTag() {
      if (this.newTag.trim()) {
        this.tags.push(this.newTag.trim());
        this.newTag = "";
        this.$nextTick(() => {
          this.$refs.tagInput.focus();
        });
      }
    },
    removeTag(index) {
      this.tags.splice(index, 1);
    },
    handleSave() {
      const selectionData = {
        bookId: this.actualBookInfo.id,
        bookTitle: this.actualBookInfo.title,
        author: this.actualBookInfo.author,
        pageNumber: this.actualPage,
        selectedText: this.actualText,
        contextParagraph: this.actualContext,
        notes: this.notes,
        tags: [...this.tags],
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
  width: 400px;
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
  padding: 15px;
  overflow-y: auto;

  h4 {
    margin: 15px 0 5px 0;
    font-size: 14px;
    color: #666;
  }
}

.book-metadata {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;

  p {
    margin: 5px 0;
    font-size: 14px;
    color: #666;
  }
}

.selected-text {
  margin-bottom: 15px;

  .highlight {
    background-color: #fff2b2;
    padding: 10px;
    border-radius: 4px;
    font-weight: 500;
    line-height: 1.5;
  }
}

.context-paragraph {
  margin-bottom: 15px;

  p {
    font-size: 14px;
    line-height: 1.5;
    color: #666;
    max-height: 150px;
    overflow-y: auto;
  }
}

.notes-section {
  margin-bottom: 15px;

  textarea {
    width: 100%;
    height: 100px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: #fff2b2;
      box-shadow: 0 0 0 2px rgba(255, 242, 178, 0.3);
    }
  }
}

.tags-section {
  margin-bottom: 15px;

  .tags-input {
    display: flex;
    margin-bottom: 10px;

    input {
      flex: 1;
      padding: 8px 10px;
      border: 1px solid #ddd;
      border-radius: 4px 0 0 4px;
      font-family: inherit;

      &:focus {
        outline: none;
        border-color: #fff2b2;
      }
    }

    .add-tag-button {
      padding: 8px 12px;
      background-color: #fff2b2;
      border: 1px solid #fff2b2;
      border-radius: 0 4px 4px 0;
      cursor: pointer;

      &:hover {
        background-color: #ffeb99;
      }
    }
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .tag {
      display: inline-flex;
      align-items: center;
      background-color: #f5f5f5;
      padding: 5px 10px;
      border-radius: 16px;
      font-size: 12px;

      .remove-tag {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #999;
        margin-left: 5px;

        &:hover {
          color: #666;
        }
      }
    }
  }
}

.panel-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 15px;
  border-top: 1px solid #e0e0e0;

  button {
    flex: 1;
    padding: 10px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
  }

  .save-button {
    background-color: #fff2b2;
    color: #333;

    &:hover {
      background-color: #ffeb99;
    }
  }

  .cancel-button {
    background-color: #f5f5f5;
    color: #666;

    &:hover {
      background-color: #ebebeb;
    }
  }
}
</style>
