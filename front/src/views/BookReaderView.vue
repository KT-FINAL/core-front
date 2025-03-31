<template>
  <div class="book-reader-container">
    <div class="header">
      <div class="elogo-container">
        <img :src="require('@/assets/Millie_Logo_Eng.png')" alt="Millie Logo Eng" class="elogo" />
        <span class="plus-sign">+</span>
      </div>
      <div class="user-menu">
        <button @click="goToLibrary" class="library-button">내 서재로 돌아가기</button>
        <span class="username">{{ userName }}님</span>
        <button @click="handleLogout" class="logout-button">로그아웃</button>
      </div>
    </div>

    <div class="content">
      <PDFReader :pdfUrl="pdfUrl" />
    </div>
  </div>
</template>

<script>
import PDFReader from "@/components/PDFReader.vue";
import { mapGetters } from "vuex";

export default {
  name: "BookReaderView",
  components: {
    PDFReader,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      book: null,
    };
  },
  computed: {
    ...mapGetters(["userName"]),
    bookTitle() {
      return this.book ? this.book.title : "Loading...";
    },
    pdfUrl() {
      if (!this.book) return "";

      // For debugging purposes
      console.log("PDF URL from book:", this.book.pdfUrl);

      // Ensure the URL is properly formatted, especially for filenames with spaces
      const url = this.book.pdfUrl;

      // For relative URLs starting with "/"
      if (url.startsWith("/")) {
        return url; // The PDFReader component will handle the full URL construction
      }

      return url;
    },
  },
  created() {
    // In a real app, you would fetch this from an API
    // For demonstration, we're using a simple array of books
    const books = [
      {
        id: "stolen-focus",
        title: "Stolen Focus: Why You Can't Pay Attention",
        author: "Johann Hari",
        pdfUrl: "/pdfs/Johann Hari - Stolen focus (2022).pdf",
        coverUrl: "/covers/Cover_Johann Hari - Stolen focus (2022).png",
      },
    ];

    // Find the book with the matching id
    this.book = books.find((book) => book.id === this.id);

    if (!this.book) {
      // Handle book not found
      console.error("Book not found:", this.id);
      this.$router.push("/library");
    }
  },
  methods: {
    goToLibrary() {
      this.$router.push("/library");
    },
    handleLogout() {
      this.$store.dispatch("logout");
      this.$router.push("/");
    },
  },
};
</script>

<style scoped>
.book-reader-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.elogo-container {
  display: flex;
  align-items: center;
  position: relative;
}

.elogo {
  height: 24px;
}

.plus-sign {
  font-size: 20px;
  color: #ff5252;
  position: relative;
  top: -4px;
  margin-left: 2px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  font-weight: 500;
}

.library-button,
.logout-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.library-button {
  background-color: #4a4a4a;
  color: white;
}

.logout-button {
  background-color: #f0f0f0;
  color: #4a4a4a;
}

.content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 0;
  overflow: hidden;
}

.book-title {
  margin: 0;
  text-align: left;
  font-size: 1.5rem;
  color: #333;
  font-weight: 600;
}
</style>
