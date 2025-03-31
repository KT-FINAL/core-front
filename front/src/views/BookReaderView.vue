<template>
  <div class="book-reader-container">
    <div class="header">
      <div class="elogo-container">
        <img :src="require('@/assets/Millie_Logo_Eng.png')" alt="Millie Logo Eng" class="elogo" />
        <span class="plus-sign">+</span>
      </div>
      <div class="user-menu">
        <button @click="goBack" class="library-button">내 서재로 돌아가기</button>
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
import { useStore } from "vuex";
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

export default {
  name: "BookReaderView",
  components: {
    PDFReader,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const bookId = route.params.id;
    const currentBook = ref(null);
    const userName = computed(() => store.getters.userName || "Guest");

    // Get current book info based on bookId
    onMounted(() => {
      // This would normally be a call to fetch book data
      // For now, we'll use hardcoded data
      console.log(`Loading book with ID: ${bookId}`);

      // In a real app, this would fetch the book by ID from an API
      // For now, we'll use hardcoded data that matches the ID
      if (bookId === "stolen-focus") {
        currentBook.value = {
          id: "stolen-focus",
          title: "Stolen Focus: Why You Can't Pay Attention",
          author: "Johann Hari",
          coverImage: "/covers/Cover_Johann Hari - Stolen focus (2022).png",
          pdfUrl: "/pdfs/Johann Hari - Stolen focus (2022).pdf",
        };
      } else {
        console.error(`Book with ID ${bookId} not found`);
        router.push("/library");
      }
    });

    const goBack = () => {
      router.push("/library");
    };

    const handleLogout = () => {
      store.dispatch("logout");
      router.push("/");
    };

    const pdfUrl = computed(() => {
      if (!currentBook.value) return "";

      // For debugging purposes
      console.log("PDF URL from book:", currentBook.value.pdfUrl);

      // Ensure the URL is properly formatted, especially for filenames with spaces
      const url = currentBook.value.pdfUrl;

      // For relative URLs starting with "/"
      if (url.startsWith("/")) {
        return url; // The PDFReader component will handle the full URL construction
      }

      return url;
    });

    return {
      currentBook,
      goBack,
      userName,
      handleLogout,
      pdfUrl,
    };
  },
};
</script>

<style scoped lang="scss">
.book-reader-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  font-family: "Noto Sans KR", sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 100;
  border-bottom: 1px solid #eee;
}

.elogo-container {
  display: flex;
  align-items: center;
  position: relative;
}

.elogo {
  height: 40px;
  margin-right: 5px;
}

.plus-sign {
  font-size: 30px;
  font-weight: bold;
  color: #ff5252;
  position: relative;
  top: -10px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  font-weight: 500;
  color: #333;
  font-size: 16px;
}

.library-button,
.logout-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.library-button {
  background-color: #fff2b2;
  color: #333;

  &:hover {
    background-color: #ffe980;
  }
}

.logout-button {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;

  &:hover {
    background-color: #e8e8e8;
  }
}

.content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 0;
  overflow: hidden;
  background-color: #f9f9f9;
}

.book-title {
  margin: 0;
  text-align: left;
  font-size: 1.5rem;
  color: #333;
  font-weight: 600;
}
</style>
