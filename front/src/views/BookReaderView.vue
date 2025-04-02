<template>
  <div class="book-reader">
    <header class="reader-header">
      <div class="book-info">
        <h1>{{ bookInfo.title }}</h1>
        <h3>{{ bookInfo.author }}</h3>
      </div>
      <div class="reader-actions">
        <button @click="goBack" class="action-button">← 돌아가기</button>
      </div>
    </header>

    <main class="reader-content">
      <PDFViewer
        :key="pdfUrl"
        :pdfUrl="pdfUrl"
        :bookInfo="bookInfo"
        @text-selected="handleTextSelection"
      />

      <TextSelectionPanel
        v-if="selectedText"
        :selectedText="selectedText"
        :contextParagraph="contextParagraph"
        :bookInfo="bookInfo"
        :pageNumber="currentPage"
        @close="clearSelection"
        @wordSaved="handleWordSaved"
      />
    </main>
  </div>
</template>

<script>
import PDFViewer from "@/components/PDFViewer.vue";
import TextSelectionPanel from "@/components/TextSelectionPanel.vue";
import { BASE_URL } from "@/services/api";

export default {
  name: "BookReaderView",
  components: {
    PDFViewer,
    TextSelectionPanel,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      bookInfo: {
        title: "",
        author: "",
        id: "",
        publisher: "",
      },
      pdfUrl: "",
      selectedText: "",
      contextParagraph: "",
      currentPage: 1,
      loading: false,
      error: null,
    };
  },
  created() {
    // Load book information based on ID
    this.fetchBookInfo();
  },
  methods: {
    async fetchBookInfo() {
      try {
        this.loading = true;
        this.error = null;

        const token = localStorage.getItem("token");

        // Fetch book data from API
        const response = await fetch(`${BASE_URL}/api/books/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const books = await response.json();

        // Find the book with matching ID
        const book = books.find((book) => book.id.toString() === this.id);

        if (!book) {
          throw new Error(`Book not found with ID: ${this.id}`);
        }

        // Set book information
        this.bookInfo = {
          id: book.id.toString(),
          title: book.title,
          author: book.author,
          publisher: book.publish,
        };

        // Set PDF URL from bookUrl
        this.pdfUrl = book.bookUrl;

        console.log("Book info fetched:", this.bookInfo);
        console.log("PDF URL:", this.pdfUrl);
      } catch (error) {
        console.error("Error fetching book info:", error);
        this.error = error.message;
        this.$router.push("/library");
      } finally {
        this.loading = false;
      }
    },

    handleTextSelection(data) {
      console.log("Text selected in book reader:", data);
      this.selectedText = data.text;
      this.contextParagraph = data.paragraph;
      this.currentPage = data.page;
    },

    clearSelection() {
      this.selectedText = "";
      this.contextParagraph = "";
    },

    handleWordSaved() {
      // 단어 저장 후 선택된 텍스트 초기화
      this.selectedText = "";
      this.contextParagraph = "";
    },

    goBack() {
      this.$router.push("/library");
    },
  },
};
</script>

<style scoped lang="scss">
.book-reader {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.reader-header {
  background-color: #fff2b2;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

  .book-info {
    h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: normal;
      color: #666;
    }
  }
}

.action-button {
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f0f0f0;
  }
}

.reader-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}
</style>
