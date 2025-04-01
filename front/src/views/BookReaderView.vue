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
      },
      pdfUrl: "",
      selectedText: "",
      contextParagraph: "",
      currentPage: 1,
    };
  },
  created() {
    // Load book information based on ID
    this.fetchBookInfo();
  },
  methods: {
    fetchBookInfo() {
      // Define book information mapping
      const bookData = {
        "stolen-focus": {
          title: "Stolen Focus: Why You Can't Pay Attention",
          author: "Johann Hari",
          publisher: "Bloomsbury Publishing",
          pdfUrl: "/pdfs/Johann Hari - Stolen focus (2022).pdf",
        },
        "harry-potter-1": {
          title: "Harry Potter and the Philosopher's Stone",
          author: "J.K. Rowling",
          publisher: "Bloomsbury Publishing",
          pdfUrl: "/pdfs/Joanne Rowling - Harry Potter 1.pdf",
        },
        desertion: {
          title: "Desertion",
          author: "Abdulrazak Gurnah",
          publisher: "Anchor Books",
          pdfUrl: "/pdfs/Abdulrazak Gurnah - Desertion (2007).pdf",
        },
        "boy-comes": {
          title: "소년이 온다",
          author: "한강",
          publisher: "창비",
          pdfUrl: "/pdfs/한강 - 소년이 온다 (2016).pdf",
        },
      };

      // Get book data based on ID
      const book = bookData[this.id];
      if (!book) {
        console.error("Book not found:", this.id);
        this.goBack();
        return;
      }

      // Set book information
      this.bookInfo = {
        id: this.id,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
      };

      // Set PDF URL
      this.pdfUrl = book.pdfUrl;
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
