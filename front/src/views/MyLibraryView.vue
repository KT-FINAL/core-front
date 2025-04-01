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
        <h1 @click="activeTab = 'search'" :class="['tab', { active: activeTab === 'search' }]">
          검색
        </h1>
      </div>
      <p class="welcome-message" v-if="activeTab !== 'search'">
        {{ userName }}님이 저장한 {{ activeTab === "library" ? "책이 " : "단어가 " }} 여기에
        표시됩니다.
      </p>

      <div v-if="activeTab === 'library'" class="library-content">
        <div v-if="books.length === 0" class="empty-library">
          <p>아직 저장된 책이 없습니다.</p>
          <button class="browse-books-btn" @click="activeTab = 'search'">책 둘러보기</button>
        </div>
        <div v-else class="books-grid">
          <div v-for="book in books" :key="book.id" class="book-card">
            <button @click="deleteBook(book.id)" class="delete-book-btn">&times;</button>
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
              <div class="book-actions">
                <button @click="openBook(book.id)" class="read-book-btn">바로 읽기</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'vocabulary'" class="vocabulary-section">
        <div class="vocabulary-header">
          <h2>내 단어장</h2>
          <button
            @click="generateStory"
            class="generate-story-button"
            :disabled="isGeneratingStory || vocabulary.length < 5"
          >
            <span v-if="isGeneratingStory">이야기 생성 중...</span>
            <span v-else>AI 이야기 만들기</span>
          </button>
        </div>

        <div v-if="story" class="story-section">
          <h3>AI가 만든 이야기</h3>
          <div class="story-content">
            <div class="story-english">
              <h4>영어</h4>
              <p>{{ story.story }}</p>
            </div>
            <div class="story-korean">
              <h4>한국어</h4>
              <p>{{ story.translation }}</p>
            </div>
            <div class="used-words">
              <h4>사용된 단어</h4>
              <div class="word-tags">
                <span v-for="word in story.used_words" :key="word" class="word-tag">
                  {{ word }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>단어장을 불러오는 중...</p>
        </div>

        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
        </div>

        <div v-else class="vocabulary-list">
          <div v-for="word in vocabulary" :key="word.id" class="vocabulary-item">
            <div class="word-header">
              <h3 class="vocabulary-word">{{ word.word }}</h3>
              <el-button type="danger" size="small" @click="handleDelete(word.id)">삭제</el-button>
            </div>
            <div class="word-content">
              <p><strong>의미:</strong> {{ word.mean }}</p>
              <p><strong>예문:</strong> {{ word.example }}</p>
              <p><strong>동의어:</strong> {{ word.synonym }}</p>
              <p><strong>반의어:</strong> {{ word.antonym }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'search'" class="search-content">
        <div class="search-bar">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="책 제목 또는 작가 이름으로 검색..."
            class="search-input"
            @keyup.enter="performSearch"
          />
          <button @click="performSearch" class="search-button">검색</button>
        </div>

        <div v-if="isSearching" class="loading">
          <el-loading :fullscreen="false" />
        </div>
        <div v-else-if="searchError" class="error">
          {{ searchError }}
        </div>
        <div v-else-if="hasSearched && searchResults.length === 0" class="empty-search-results">
          <p>검색 결과가 없습니다. 다른 검색어를 시도해보세요.</p>
        </div>
        <div class="search-results-header" v-if="hasSearched">
          <h2>
            검색 결과 <span class="divider">|</span>
            <span class="reset-link" @click="viewAllBooks">검색 초기화</span>
          </h2>
        </div>
        <div class="search-results-title" v-else>
          <h2>모든 도서</h2>
        </div>
        <div class="books-grid">
          <div v-for="book in displayedBooks" :key="book.id" class="book-card">
            <div class="book-cover">
              <img v-if="book.coverImage" :src="book.coverImage" :alt="book.title" />
              <div v-else class="placeholder-cover">
                <p>{{ book.title }}</p>
                <p class="author-placeholder">{{ book.author }}</p>
              </div>
            </div>
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">{{ book.author }}</p>
              <div class="book-actions">
                <button
                  v-if="isBookInLibrary(book.id)"
                  @click="openBook(book.id)"
                  class="read-book-btn"
                >
                  바로 읽기
                </button>
                <template v-else>
                  <button @click="addAndRead(book)" class="read-now-btn">바로 읽기</button>
                  <button @click="addToLibrary(book)" class="add-to-library-btn">
                    내 서재에 담기
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { vocabularyService, userService } from "@/services/api";
import { ElMessage } from "element-plus";

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
        {
          id: "harry-potter-1",
          title: "Harry Potter and the Philosopher's Stone",
          author: "J.K. Rowling",
          coverImage: "/covers/Cover_Joanne Rowling - Harry Potter 1.png",
          pdfUrl: "/pdfs/Joanne Rowling - Harry Potter 1.pdf",
        },
        {
          id: "desertion",
          title: "Desertion",
          author: "Abdulrazak Gurnah",
          coverImage: "/covers/Cover_Abdulrazak Gurnah - Desertion (2007).png",
          pdfUrl: "/pdfs/Abdulrazak Gurnah - Desertion (2007).pdf",
        },
        {
          id: "boy-comes",
          title: "소년이 온다",
          author: "한강",
          coverImage: "/covers/Cover_한강 - 소년이 온다 (2016).png",
          pdfUrl: "/pdfs/한강 - 소년이 온다 (2016).pdf",
        },
      ],
      vocabulary: [],
      loading: false,
      error: null,
      userName: "User", // 기본값 설정
      // Search functionality
      searchQuery: "",
      searchResults: [],
      isSearching: false,
      searchError: null,
      hasSearched: false,
      showAllBooks: true,
      allBooks: [
        {
          id: "stolen-focus",
          title: "Stolen Focus: Why You Can't Pay Attention",
          author: "Johann Hari",
          coverImage: "/covers/Cover_Johann Hari - Stolen focus (2022).png",
          pdfUrl: "/pdfs/Johann Hari - Stolen focus (2022).pdf",
          publisher: "Bloomsbury Publishing",
        },
        {
          id: "harry-potter-1",
          title: "Harry Potter and the Philosopher's Stone",
          author: "J.K. Rowling",
          coverImage: "/covers/Cover_Joanne Rowling - Harry Potter 1.png",
          pdfUrl: "/pdfs/Joanne Rowling - Harry Potter 1.pdf",
          publisher: "Bloomsbury Publishing",
        },
        {
          id: "desertion",
          title: "Desertion",
          author: "Abdulrazak Gurnah",
          coverImage: "/covers/Cover_Abdulrazak Gurnah - Desertion (2007).png",
          pdfUrl: "/pdfs/Abdulrazak Gurnah - Desertion (2007).pdf",
          publisher: "Bloomsbury Publishing",
        },
        {
          id: "boy-comes",
          title: "소년이 온다",
          author: "한강",
          coverImage: "/covers/Cover_한강 - 소년이 온다 (2016).png",
          pdfUrl: "/pdfs/한강 - 소년이 온다 (2016).pdf",
          publisher: "창비",
        },
        {
          id: "pride-and-prejudice",
          title: "Pride and Prejudice",
          author: "Jane Austen",
          coverImage: "/covers/Cover_Jane Austen - Pride and Prejudice.png",
          pdfUrl: "/pdfs/Jane Austen - Pride and Prejudice.pdf",
          publisher: "Penguin Classics",
        },
        {
          id: "1984",
          title: "1984",
          author: "George Orwell",
          coverImage: "/covers/Cover_George Orwell - 1984.png",
          pdfUrl: "/pdfs/George Orwell - 1984.pdf",
          publisher: "Penguin Books",
        },
        {
          id: "to-kill-a-mockingbird",
          title: "To Kill a Mockingbird",
          author: "Harper Lee",
          coverImage: "/covers/Cover_Harper Lee - To Kill a Mockingbird.png",
          pdfUrl: "/pdfs/Harper Lee - To Kill a Mockingbird.pdf",
          publisher: "J. B. Lippincott & Co.",
        },
        {
          id: "the-great-gatsby",
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          coverImage: "/covers/Cover_F. Scott Fitzgerald - The Great Gatsby.png",
          pdfUrl: "/pdfs/F. Scott Fitzgerald - The Great Gatsby.pdf",
          publisher: "Charles Scribner's Sons",
        },
      ],
      isGeneratingStory: false,
      story: null,
      storyError: null,
    };
  },
  computed: {
    displayedBooks() {
      return this.hasSearched ? this.searchResults : this.allBooks;
    },
  },
  watch: {
    activeTab: {
      immediate: true,
      handler(newTab) {
        if (newTab === "vocabulary") {
          this.fetchVocabulary();
        }
      },
    },
  },
  async mounted() {
    this.checkForExtractedCovers();
    await this.fetchUserInfo();
  },
  methods: {
    handleLogout() {
      localStorage.removeItem("user");
      localStorage.removeItem("token"); // 토큰도 삭제
      this.$router.push("/");
    },
    async fetchUserInfo() {
      try {
        const userInfo = await userService.getUserInfo();
        this.userName = userInfo.name;
      } catch (error) {
        console.error("사용자 정보 로딩 에러:", error);
        ElMessage.error("사용자 정보를 불러오는데 실패했습니다.");
      }
    },
    openBook(bookId) {
      this.$router.push(`/book/${bookId}`);
    },
    checkForExtractedCovers() {
      this.books.forEach((book) => {
        const savedCover = localStorage.getItem(`book_cover_${book.id}`);
        if (savedCover) {
          book.extractedCover = savedCover;
        }
      });
    },
    async fetchVocabulary() {
      try {
        this.loading = true;
        this.error = null;
        const response = await vocabularyService.getVocabularyList();
        this.vocabulary = Array.isArray(response) ? response : [];
      } catch (error) {
        console.error("단어장 로딩 에러:", error);
        this.error = "단어장을 불러오는데 실패했습니다.";
        ElMessage.error("단어장을 불러오는데 실패했습니다.");
      } finally {
        this.loading = false;
      }
    },
    async handleDelete(wordId) {
      try {
        await this.$confirm("이 단어를 삭제하시겠습니까?", "단어 삭제", {
          confirmButtonText: "삭제",
          cancelButtonText: "취소",
          type: "warning",
        });
        await vocabularyService.deleteWord(wordId);
        ElMessage.success("단어가 삭제되었습니다.");
        await this.fetchVocabulary(); // 목록 새로고침
      } catch (error) {
        if (error !== "cancel") {
          console.error("단어 삭제 에러:", error);
          ElMessage.error("단어 삭제에 실패했습니다.");
        }
      }
    },
    deleteBook(bookId) {
      if (confirm("이 책을 내 서재에서 삭제하시겠습니까?")) {
        // Filter out the book with the matching ID
        this.books = this.books.filter((book) => book.id !== bookId);
        // Remove the extracted cover from localStorage
        localStorage.removeItem(`book_cover_${bookId}`);
        ElMessage.success("책이 내 서재에서 삭제되었습니다.");
      }
    },
    // Search functionality
    performSearch() {
      if (!this.searchQuery.trim()) {
        this.searchError = "검색어를 입력해주세요.";
        return;
      }

      this.isSearching = true;
      this.searchError = null;
      this.hasSearched = true;
      this.showAllBooks = false;

      try {
        const query = this.searchQuery.toLowerCase();

        // In a real app, this would be an API call
        // Always search in both title and author (the "all" option)
        setTimeout(() => {
          this.searchResults = this.allBooks.filter(
            (book) =>
              book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query)
          );

          this.isSearching = false;
        }, 500);
      } catch (error) {
        console.error("검색 중 오류 발생:", error);
        this.searchError = "검색 중 오류가 발생했습니다.";
        this.isSearching = false;
      }
    },
    isBookInLibrary(bookId) {
      return this.books.some((book) => book.id === bookId);
    },
    addToLibrary(book) {
      if (this.isBookInLibrary(book.id)) {
        ElMessage.info("이미 내 서재에 있는 책입니다.");
        return;
      }

      this.books.push({ ...book });
      ElMessage.success("책이 내 서재에 추가되었습니다.");
    },
    addAndRead(book) {
      if (!this.isBookInLibrary(book.id)) {
        this.books.push({ ...book });
        ElMessage.success("책이 내 서재에 추가되었습니다.");
      }
      this.openBook(book.id);
    },
    viewAllBooks() {
      this.searchQuery = "";
      this.hasSearched = false;
      this.searchResults = [];
      this.searchError = null;
      this.showAllBooks = true;
    },
    async generateStory() {
      if (this.vocabulary.length < 5) {
        ElMessage.warning("단어장에 최소 5개의 단어가 필요합니다.");
        return;
      }

      this.isGeneratingStory = true;
      this.storyError = null;

      try {
        // 무작위로 5개의 단어 선택
        const randomWords = this.vocabulary
          .sort(() => 0.5 - Math.random())
          .slice(0, 5)
          .map((word) => word.word);

        // AI 이야기 생성
        const response = await vocabularyService.createStory(randomWords);
        this.story = response;
      } catch (error) {
        console.error("이야기 생성 에러:", error);
        this.storyError = "이야기 생성에 실패했습니다.";
        ElMessage.error("이야기 생성에 실패했습니다.");
      } finally {
        this.isGeneratingStory = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.mylibrary-container {
  width: 100%;
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
  padding: 20px 0;
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
  font-size: 18px;
}

.empty-library {
  text-align: center;
  padding: 60px 0;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-top: 20px;

  p {
    color: #666;
    font-size: 18px;
    margin-bottom: 20px;
  }
}

.empty-vocabulary {
  text-align: center;
  padding: 60px 0;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-top: 20px;

  p {
    color: #666;
    font-size: 18px;
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
  transition: all 0.2s;

  &:hover {
    background-color: #ffe980;
  }
}

.library-content {
  margin-top: 20px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 30px;
  padding: 10px;
}

.book-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  background-color: white;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }

  &:hover .delete-book-btn {
    opacity: 1;
  }
}

.delete-book-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  color: #ff5252;
  border: none;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
}

.book-cover {
  height: 320px;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.book-info {
  padding: 15px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 120px;
}

.book-title {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 40px;
}

.book-author {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.read-book-btn {
  width: 100%;
  height: 40px;
  padding: 10px 0;
  background-color: #fff2b2;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  margin-top: auto;

  &:hover {
    background-color: #ffe980;
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
    color: #333;
  }
}

.vocabulary-section {
  margin-top: 20px;
}

.vocabulary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .generate-story-button {
    background-color: #fff2b2;
    color: #333;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background-color: #ffeb99;
    }

    &:disabled {
      background-color: #f5f5f5;
      color: #999;
      cursor: not-allowed;
    }
  }
}

.story-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h3 {
    margin: 0 0 16px;
    color: #333;
    font-size: 18px;
  }

  .story-content {
    .story-english,
    .story-korean {
      margin-bottom: 16px;

      h4 {
        margin: 0 0 8px;
        color: #666;
        font-size: 14px;
      }

      p {
        margin: 0;
        line-height: 1.6;
        font-size: 16px;
      }
    }

    .used-words {
      h4 {
        margin: 0 0 8px;
        color: #666;
        font-size: 14px;
      }

      .word-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .word-tag {
          background-color: #fff2b2;
          color: #333;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
        }
      }
    }
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.error {
  color: #f56c6c;
  text-align: center;
  padding: 20px;
}

.vocabulary-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 30px;
  padding: 10px;
}

.vocabulary-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  background-color: white;

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
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.language-tag {
  font-size: 14px;
  color: #666;
  display: inline-block;
  padding: 2px 6px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-right: 5px;
}

.word-definition {
  padding: 15px;
}

.part-of-speech {
  margin: 0 0 5px 0;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  font-style: italic;
}

.example {
  margin-top: 5px;
  margin-left: 20px;
  font-size: 14px;
  color: #666;
}

.example-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.word-meta {
  padding: 15px;
  background-color: #f5f5f5;
  border-top: 1px solid #eee;
  font-size: 14px;
  color: #666;
}

.book-info,
.page-info,
.date-info {
  display: inline-block;
  margin-right: 10px;
}

.phonetic {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
  font-style: italic;
}

.search-content {
  margin-top: 20px;
}

.search-bar {
  display: flex;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #c8c8c8;
  }
}

.search-button {
  background-color: #fff2b2;
  color: #333;
  border: none;
  border-radius: 0 4px 4px 0;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #ffe980;
  }
}

.search-filters {
  display: none;
}

.filter-option {
  display: none;
}

.empty-search-results,
.search-instructions {
  text-align: center;
  padding: 40px 0;
  background-color: #f5f5f5;
  border-radius: 8px;

  p {
    color: #666;
    font-size: 16px;
  }
}

.book-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
}

.read-book-btn {
  width: 100%;
  height: 40px;
  padding: 10px 0;
  background-color: #fff2b2;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  margin-top: auto;

  &:hover {
    background-color: #ffe980;
  }
}

.read-now-btn {
  width: 100%;
  height: 40px;
  padding: 10px 0;
  background-color: #fff2b2;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background-color: #ffe980;
  }
}

.add-to-library-btn {
  width: 100%;
  height: 40px;
  padding: 10px 0;
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background-color: #e8e8e8;
  }
}

.search-results-header {
  margin: 20px 0 10px 0;

  h2 {
    font-size: 20px;
    font-weight: 500;
    color: #333;
    margin: 0;
    display: flex;
    align-items: center;
  }

  .divider {
    margin: 0 10px;
    color: #999;
  }

  .reset-link {
    font-size: 16px;
    color: #333;
    cursor: pointer;
    font-weight: normal;

    &:hover {
      text-decoration: underline;
    }
  }
}

.search-results-title {
  margin: 20px 0 10px 0;

  h2 {
    font-size: 20px;
    font-weight: 500;
    color: #333;
    margin: 0;
  }
}

.search-instructions {
  text-align: center;
  padding: 40px 0;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-top: 20px;

  p {
    color: #666;
    font-size: 16px;
  }
}

.search-actions {
  display: none;
}

.view-all-button {
  display: none;
}
</style>
