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
        {{ userName }}님이 저장한
        {{ activeTab === "library" ? "책이 " : "단어가 " }}
        여기에 표시됩니다.
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
          <button class="browse-books-btn">책을 읽고 단어 추가하기</button>
        </div>
        <div v-else class="vocabulary-list">
          <div v-for="(entry, index) in vocabulary" :key="index" class="vocabulary-item">
            <div class="word-header">
              <h3 class="vocabulary-word">{{ entry.word }}</h3>
              <span class="language-tag">{{ entry.language === "ko" ? "한국어" : "영어" }}</span>
              <div v-if="entry.phonetic" class="phonetic">{{ entry.phonetic }}</div>
            </div>
            <div class="word-definition">
              <div v-for="(meaning, mIndex) in entry.definition" :key="mIndex">
                <p class="part-of-speech">{{ meaning.partOfSpeech }}</p>
                <ul>
                  <li v-for="(def, dIndex) in meaning.definitions" :key="dIndex">
                    {{ def.definition }}
                    <div v-if="def.example" class="example">
                      <span class="example-label">예시:</span> {{ def.example }}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div class="word-meta">
              <span class="book-info">책: {{ entry.bookId }}</span>
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
          pdfUrl: "/pdfs/Johann Hari - Stolen focus (2022).pdf",
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
      // Clear user data from localStorage
      this.$store.dispatch("logout");
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
  height: 30px;
  margin-right: 3px;
}

.plus-sign {
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
  position: relative;
  top: -6px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  font-size: 16px;
  font-weight: 500;
}

.logout-button {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }
}

.content {
  padding: 20px 0;
}

.tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.tab {
  font-size: 23px;
  margin: 0;
  color: #999;
  cursor: pointer;
  font-weight: normal;
  position: relative;
  padding-bottom: 5px;
  transition: all 0.2s ease;

  &.active {
    color: #333;
    font-weight: 700;

    &:after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: #333;
    }
  }

  &:hover:not(.active) {
    color: #666;
  }
}

.welcome-message {
  color: #666;
  margin-bottom: 30px;
}

.empty-library,
.empty-vocabulary {
  text-align: center;
  padding: 60px 0;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 20px;

  p {
    color: #888;
    margin-bottom: 20px;
  }
}

.browse-books-btn {
  background-color: #fff2b2;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #ffe980;
  }
}

.library-content {
  margin-top: 20px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 30px;
}

.book-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  background-color: white;

  &:hover {
    transform: translateY(-5px);
  }
}

.book-cover {
  height: 280px;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.book-info {
  padding: 15px;
}

.book-title {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 500;
}

.book-author {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #666;
}

.read-book-btn {
  width: 100%;
  padding: 8px 0;
  background-color: #4a4a4a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #333;
  }
}

.placeholder-cover {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;

  p {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }
}

.vocabulary-content {
  margin-top: 20px;
}

.vocabulary-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 30px;
}

.vocabulary-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  background-color: white;

  &:hover {
    transform: translateY(-5px);
  }
}

.word-header {
  padding: 15px;
  background-color: #f0f0f0;
}

.vocabulary-word {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 500;
}

.language-tag {
  font-size: 14px;
  color: #666;
}

.word-definition {
  padding: 15px;
}

.part-of-speech {
  margin: 0 0 5px 0;
  font-size: 14px;
  font-weight: 500;
}

.example {
  margin-top: 5px;
  margin-left: 20px;
}

.example-label {
  font-size: 14px;
  color: #666;
}

.word-meta {
  padding: 15px;
  background-color: #f0f0f0;
}

.book-info {
  margin-top: 5px;
  font-size: 14px;
  color: #666;
}

.page-info {
  margin-left: 10px;
}

.date-info {
  margin-left: 10px;
}

.phonetic {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}
</style>
