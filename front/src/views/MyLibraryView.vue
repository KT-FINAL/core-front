<template>
  <div class="mylibrary-container">
    <div class="header">
      <div class="elogo-container">
        <img :src="require('@/assets/Millie_Logo_Eng.png')" alt="Millie Logo Eng" class="elogo" />
        <span class="plus-sign">+</span>
      </div>
      <div class="user-menu">
        <span class="username">{{ userName }}님</span>
        <button @click="handleLogout" class="logout-button">로그아웃</button>
      </div>
    </div>

    <div class="content">
      <div class="tabs">
        <h1 @click="activeTab = 'library'" :class="['tab', { active: activeTab === 'library' }]">
          내 서재
        </h1>
        <h1
          @click="activeTab = 'vocabulary'"
          :class="['tab', { active: activeTab === 'vocabulary' }]"
        >
          내 단어장
        </h1>
      </div>
      <p class="welcome-message">
        {{ userName }}님이 저장한 {{ activeTab === "library" ? "책이 " : "단어가 " }} 여기에
        표시됩니다.
      </p>

      <div v-if="activeTab === 'library'" class="library-content">
        <div v-if="books.length === 0" class="empty-library">
          <p>아직 저장된 책이 없습니다.</p>
          <button class="browse-books-btn">책 둘러보기</button>
        </div>
        <div v-else class="books-grid">
          <div v-for="book in books" :key="book.id" class="book-card">
            <div class="book-cover">
              <img v-if="book.extractedCover" :src="book.extractedCover" :alt="book.title" />
              <img v-else-if="book.coverImage" :src="book.coverImage" :alt="book.title" />
              <div v-else class="placeholder-cover">
                <p>{{ book.title }}</p>
                <p class="author-placeholder">{{ book.author }}</p>
              </div>
            </div>
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">{{ book.author }}</p>
              <button @click="openBook(book.id)" class="read-book-btn">읽기</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'vocabulary'" class="vocabulary-content">
        <div v-if="vocabulary.length === 0" class="empty-vocabulary">
          <p>아직 저장된 단어가 없습니다.</p>
          <button class="browse-books-btn vocabulary-btn">책을 읽고 단어 추가하기</button>
        </div>
        <div v-else class="vocabulary-list">
          <div v-for="(entry, index) in vocabulary" :key="index" class="vocabulary-item">
            <div class="word-header">
              <h3 class="vocabulary-word">{{ entry.word }}</h3>
            </div>
            <div class="word-context">
              <p>{{ entry.context }}</p>
            </div>
            <div class="word-meta">
              <span class="book-info">{{ entry.bookTitle }}</span>
              <span class="author-info">{{ entry.bookAuthor }}</span>
              <span class="page-info">페이지: {{ entry.page }}</span>
              <span class="date-info">저장일: {{ formatDate(entry.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "MyLibraryView",
  data() {
    return {
      activeTab: "library",
      books: [
        {
          id: "stolen-focus",
          title: "Stolen Focus: Why You Can't Pay Attention",
          author: "Johann Hari",
          coverImage: "/covers/Cover_Johann Hari - Stolen focus (2022).png",
        },
      ],
      vocabulary: [],
    };
  },
  computed: {
    ...mapGetters(["userName"]),
  },
  mounted() {
    // Check if we have extracted covers in localStorage
    this.checkForExtractedCovers();
    // Load vocabulary from localStorage
    this.loadVocabulary();
  },
  methods: {
    handleLogout() {
      // Just clear local user data without requiring backend
      localStorage.removeItem("user");
      // Redirect to login page
      this.$router.push("/");
    },
    openBook(bookId) {
      this.$router.push(`/book/${bookId}`);
    },
    checkForExtractedCovers() {
      // For each book, check if we have an extracted cover in localStorage
      this.books.forEach((book) => {
        const savedCover = localStorage.getItem(`book_cover_${book.id}`);
        if (savedCover) {
          // Use the extracted cover instead of the default one
          book.extractedCover = savedCover;
        }
      });
    },
    loadVocabulary() {
      try {
        // Load vocabulary from localStorage
        const savedVocabulary = localStorage.getItem("vocabulary");
        if (savedVocabulary) {
          this.vocabulary = JSON.parse(savedVocabulary);
          // Sort by timestamp (most recent first)
          this.vocabulary.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
          });
        }
      } catch (error) {
        console.error("Error loading vocabulary:", error);
        this.vocabulary = [];
      }
    },
    formatDate(timestamp) {
      try {
        const date = new Date(timestamp);
        return date.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch (error) {
        return timestamp;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.mylibrary-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Noto Sans KR", sans-serif;
  background-color: white;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.elogo-container {
  display: flex;
  align-items: center;
}

.elogo {
  height: 40px;
  margin-right: 0px;
}

.plus-sign {
  font-size: 30px;
  font-weight: bold;
  line-height: 1;
  position: relative;
  top: -10px;
  color: #ff5252;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.logout-button {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #e8e8e8;
  }
}

.content {
  width: 100%;
}

.tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.tab {
  font-size: 24px;
  margin: 0;
  color: #999;
  font-weight: normal;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;

  &.active {
    color: #333;
    font-weight: 700;

    &:after {
      content: "";
      position: absolute;
      width: 100%;
      height: 2px;
      background-color: #333;
      bottom: 0;
      left: 0;
    }
  }

  &:hover:not(.active) {
    color: #666;
  }
}

.welcome-message {
  font-size: 16px;
  color: #666;
  margin-top: 5px;
  margin-bottom: 30px;
}

.empty-library {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 300px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 50px;
  text-align: center;

  p {
    font-size: 18px;
    color: #666;
  }
}

.browse-books-btn {
  background-color: #ff5252;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #e73838;
  }
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 30px;
  margin-top: 20px;
}

.book-card {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
  }
}

.book-cover {
  position: relative;
  height: 260px;
  overflow: hidden;
  background-color: #f5f5f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.placeholder-cover {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  color: #333;
  text-align: center;

  p {
    font-weight: bold;
    font-size: 16px;
    margin: 0;
  }

  .author-placeholder {
    font-weight: normal;
    margin-top: 10px;
    font-size: 14px;
    color: #666;
  }
}

.book-info {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.book-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-author {
  font-size: 14px;
  color: #666;
  margin: 0 0 15px 0;
}

.read-book-btn {
  background-color: #fff2b2;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #ffe980;
  }
}

.empty-vocabulary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 300px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 50px;
  text-align: center;

  p {
    font-size: 18px;
    color: #666;
  }
}

.vocabulary-btn {
  background-color: #fff2b2;
  color: #333;

  &:hover {
    background-color: #ffe980;
  }
}

.vocabulary-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.vocabulary-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-color: white;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }
}

.word-header {
  padding: 15px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #eee;
}

.vocabulary-word {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.word-context {
  padding: 15px;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  max-height: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
}

.word-meta {
  padding: 15px;
  background-color: #f5f5f5;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.book-info {
  font-weight: 500;
}
</style>
