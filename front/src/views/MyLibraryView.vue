<template>
  <div class="mylibrary-container">
    <div class="header">
      <div class="elogo-container">
        <img :src="require('@/assets/Millie_Logo_Eng.png')" alt="Millie Logo Eng" class="elogo" />
        <span class="plus-sign">+</span>
      </div>
      <div class="user-menu">
        <span class="username">{{ userName }}님</span>
        <span class="premium-badge">Premium 구독중</span>
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
        <h1
          @click="activeTab = 'aistories'"
          :class="['tab', { active: activeTab === 'aistories' }]"
        >
          내 AI 이야기
        </h1>
        <h1 @click="activeTab = 'search'" :class="['tab', { active: activeTab === 'search' }]">
          검색
        </h1>
      </div>
      <p class="welcome-message" v-if="activeTab !== 'search'">
        {{ userName }}님이 저장한
        {{
          activeTab === "library"
            ? "책이 "
            : activeTab === "vocabulary"
            ? "단어가 "
            : "AI 이야기가 "
        }}
        여기에 표시됩니다.
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
              <p class="book-publisher">{{ book.publisher }}</p>
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
          <div class="vocabulary-actions">
            <button @click="flipAllCards(true)" class="flip-button">단어 뜻 보기</button>
            <button @click="flipAllCards(false)" class="flip-button">단어만 보기</button>
            <button
              @click="generateStory"
              class="generate-story-button"
              :disabled="isGeneratingStory || vocabulary.length < 5"
            >
              <span v-if="isGeneratingStory">이야기 생성 중...</span>
              <span v-else>AI 이야기 만들기</span>
            </button>
          </div>
        </div>

        <div v-if="story" class="story-section">
          <div class="story-header">
            <h3>AI가 만든 이야기</h3>
            <div class="story-actions">
              <div class="save-button-container">
                <button
                  @click="saveStory"
                  class="save-story-button"
                  :disabled="!generatedImage && !story.aiImage"
                >
                  저장하기
                </button>
                <div v-if="!generatedImage && !story.aiImage" class="tooltip">
                  이미지 생성한 후 요청해주세요.
                </div>
              </div>
              <button @click="toggleHighlight" class="highlight-button">
                {{ isHighlighted ? "하이라이트 끄기" : "사용된 단어 보기" }}
              </button>
            </div>
          </div>
          <div class="story-content">
            <div class="story-tabs">
              <button
                :class="['story-tab', { active: storyTab === 'english' }]"
                @click="storyTab = 'english'"
              >
                영어
              </button>
              <button
                :class="['story-tab', { active: storyTab === 'korean' }]"
                @click="storyTab = 'korean'"
              >
                한국어
              </button>
              <button
                :class="['story-tab', { active: storyTab === 'image' }]"
                @click="storyTab = 'image'"
              >
                이미지
              </button>
            </div>
            <div class="story-text">
              <p v-if="storyTab === 'english'" v-html="highlightedStory"></p>
              <p v-else-if="storyTab === 'korean'">{{ story.translation }}</p>
              <div v-else-if="storyTab === 'image'" class="story-image">
                <div v-if="isGeneratingImage" class="image-loading">
                  <div class="spinner"></div>
                  <p>이미지 생성 중...</p>
                </div>
                <img v-else-if="generatedImage" :src="generatedImage" alt="Generated Story Image" />
                <button v-else @click="generateImage" class="generate-image-btn">
                  AI 이야기로 이미지를 생성해보세요!
                </button>
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
          <div
            v-for="word in vocabulary"
            :key="word.id"
            class="vocabulary-item"
            @click="toggleWordCard(word.id)"
          >
            <div class="card-inner" :class="{ 'is-flipped': flippedCards[word.id] }">
              <button @click.stop="handleDelete(word.id)" class="delete-vocabulary-btn">
                &times;
              </button>
              <div class="card-front">
                <div class="word-header">
                  <h3 class="vocabulary-word">{{ word.word }}</h3>
                </div>
              </div>
              <div class="card-back">
                <div class="word-header">
                  <h3 class="vocabulary-word">{{ word.word }}</h3>
                </div>
                <div class="word-content">
                  <p><strong>의미:</strong> {{ word.mean }}</p>
                  <p class="example-sentence"><strong>예문:</strong> {{ word.example }}</p>
                  <p><strong>동의어:</strong> {{ word.synonym || "없음" }}</p>
                  <p><strong>반의어:</strong> {{ word.antonym || "없음" }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'aistories'" class="aistories-section">
        <div class="aistories-header">
          <h2>내 AI 이야기</h2>
        </div>
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>AI 이야기를 불러오는 중...</p>
        </div>
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
        </div>
        <div v-else-if="aiStories.length === 0" class="empty-aistories">
          <p>아직 생성된 AI 이야기가 없습니다.</p>
        </div>
        <div v-else class="aistories-grid">
          <div v-for="story in aiStories" :key="story.id" class="aistory-card">
            <button @click="deleteAIStory(story.id)" class="delete-aistory-btn">&times;</button>
            <div class="aistory-content">
              <div class="aistory-tabs">
                <button
                  :class="['aistory-tab', { active: story.activeTab === 'english' }]"
                  @click="story.activeTab = 'english'"
                >
                  영어
                </button>
                <button
                  :class="['aistory-tab', { active: story.activeTab === 'korean' }]"
                  @click="story.activeTab = 'korean'"
                >
                  한국어
                </button>
                <button
                  :class="['aistory-tab', { active: story.activeTab === 'image' }]"
                  @click="story.activeTab = 'image'"
                >
                  이미지
                </button>
              </div>
              <div class="aistory-text">
                <p v-if="story.activeTab === 'english'" v-html="getHighlightedStory(story)"></p>
                <p v-else-if="story.activeTab === 'korean'">{{ story.koreanStory }}</p>
                <div v-else-if="story.activeTab === 'image'" class="aistory-image">
                  <img v-if="story.aiImage" :src="story.aiImage" alt="AI Generated Story Image" />
                  <p v-else class="no-image">이미지가 없습니다.</p>
                </div>
              </div>
              <div class="aistory-meta">
                <div class="aistory-actions">
                  <button @click="toggleStoryHighlight(story.id)" class="highlight-button">
                    {{ story.isHighlighted ? "하이라이트 끄기" : "사용된 단어 보기" }}
                  </button>
                </div>
                <p>생성일: {{ formatDate(story.createdAt) }}</p>
                <div class="used-words">
                  <span v-for="word in JSON.parse(story.wordList)" :key="word" class="word-tag">
                    {{ word }}
                  </span>
                </div>
              </div>
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

        <div v-if="isSearching || isLoadingBooks" class="loading">
          <div class="spinner"></div>
          <p>책을 불러오는 중...</p>
        </div>
        <div v-else-if="searchError" class="error">
          {{ searchError }}
        </div>
        <div v-else-if="hasSearched && searchResults.length === 0" class="empty-search-results">
          <p>검색 결과가 없습니다. 다른 검색어를 시도해보세요.</p>
        </div>
        <div class="search-results-header" v-if="hasSearched && !isLoadingBooks">
          <h2>
            검색 결과 <span class="divider">|</span>
            <span class="reset-link" @click="viewAllBooks">검색 초기화</span>
          </h2>
        </div>
        <div class="search-results-title" v-else-if="!isLoadingBooks">
          <h2>모든 도서</h2>
        </div>
        <div v-if="!isLoadingBooks && !isSearching" class="books-grid">
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
              <p v-if="book.publisher" class="book-publisher">{{ book.publisher }}</p>
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
import { vocabularyService, userService, BASE_URL } from "@/services/api";
import { ElMessage } from "element-plus";

export default {
  name: "MyLibraryView",
  data() {
    return {
      activeTab: "library",
      storyTab: "english",
      flippedCards: {},
      isPremium: false,
      books: [],
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
      allBooks: [],
      isLoadingBooks: false,
      isGeneratingStory: false,
      story: null,
      storyError: null,
      isHighlighted: false,
      isGeneratingImage: false,
      generatedImage: null,
      aiStories: [],
    };
  },
  computed: {
    displayedBooks() {
      return this.hasSearched ? this.searchResults : this.allBooks;
    },
    highlightedStory() {
      if (!this.story || !this.isHighlighted) return this.story?.story || "";

      let text = this.story.story;
      this.story.used_words.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        text = text.replace(regex, `<span class="highlighted-word">$&</span>`);
      });
      return text;
    },
  },
  watch: {
    activeTab: {
      immediate: true,
      handler(newTab) {
        if (newTab === "vocabulary") {
          this.fetchVocabulary();
        } else if (newTab === "aistories") {
          this.fetchAIStories();
        }
      },
    },
  },
  async mounted() {
    await this.fetchUserInfo();
    await this.fetchAllBooks();
    this.checkForExtractedCovers();
    if (this.activeTab === "aistories") {
      await this.fetchAIStories();
    }
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
        this.isPremium = userInfo.isPremium;
      } catch (error) {
        console.error("사용자 정보 로딩 에러:", error);
        ElMessage.error("사용자 정보를 불러오는데 실패했습니다.");
      }
    },
    async fetchAllBooks() {
      try {
        this.isLoadingBooks = true;
        const token = localStorage.getItem("token");

        const response = await fetch(`${BASE_URL}/api/books/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const books = await response.json();

        // Convert data format
        this.allBooks = books.map((book) => ({
          id: book.id.toString(),
          title: book.title,
          author: book.author,
          coverImage: book.coverUrl,
          pdfUrl: book.bookUrl,
          publisher: book.publish,
        }));

        // Load user's library books
        await this.fetchMyLibraryBooks();
      } catch (error) {
        console.error("책 목록 로딩 에러:", error);
        ElMessage.error("책 목록을 불러오는데 실패했습니다.");
      } finally {
        this.isLoadingBooks = false;
      }
    },

    async fetchMyLibraryBooks() {
      try {
        const token = localStorage.getItem("token");

        // Use the exact API endpoint as specified in the documentation
        const response = await fetch(`${BASE_URL}/api/books/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const myBooks = await response.json();

        // Get list of book IDs from the user's library returned by API
        if (Array.isArray(myBooks) && myBooks.length > 0) {
          // Find and display book information based on IDs in the user's library
          this.books = myBooks
            .map((myBook) => {
              // Check if allBook property exists
              const bookId = myBook.allBook?.id || myBook.id;
              // Find the book with matching ID from the complete book list
              const foundBook = this.allBooks.find(
                (book) => book.id.toString() === bookId.toString()
              );

              if (foundBook) {
                return {
                  ...foundBook,
                  myBookId: myBook.id, // Save the ID of the library item (for deletion etc.)
                };
              }
              return null;
            })
            .filter((book) => book !== null); // Filter out null values
        } else {
          // Empty array or unexpected format
          this.books = [];
        }
      } catch (error) {
        console.error("내 서재 불러오기 에러:", error);
        ElMessage.error("내 서재를 불러오는데 실패했습니다.");
        // Set to empty array in case of error
        this.books = [];
      }
    },

    async addToLibrary(book) {
      if (this.isBookInLibrary(book.id)) {
        ElMessage.info("이미 내 서재에 있는 책입니다.");
        return;
      }

      try {
        const token = localStorage.getItem("token");

        // Use the exact API endpoint and payload structure specified in the documentation
        const response = await fetch(`${BASE_URL}/api/books/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            allbookId: parseInt(book.id),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the response to get the new book entry ID
        const data = await response.json();
        console.log("Book registration response:", data);

        // Update local state after receiving response from server
        // If we have a book ID from the response, use it as myBookId
        const newBook = {
          ...book,
          myBookId: data.id || data.bookId, // Use appropriate property based on API response
        };

        // Add the new book to the books array
        this.books.push(newBook);
        ElMessage.success("책이 내 서재에 추가되었습니다.");

        // If the book was just added and no myBookId is set, refresh the library
        if (!newBook.myBookId) {
          console.log("No myBookId set, refreshing library");
          await this.fetchMyLibraryBooks();
        }
      } catch (error) {
        console.error("책 추가 에러:", error);
        ElMessage.error("책을 내 서재에 추가하는데 실패했습니다.");
      }
    },

    async addAndRead(book) {
      if (!this.isBookInLibrary(book.id)) {
        try {
          await this.addToLibrary(book);
          this.openBook(book.id);
        } catch (error) {
          console.error("책 추가 및 읽기 에러:", error);
        }
      } else {
        this.openBook(book.id);
      }
    },
    openBook(bookId) {
      console.log("Opening book with ID:", bookId);
      // Ensure bookId is converted to string if needed
      this.$router.push(`/book/${bookId.toString()}`);
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
    async removeBookFromLibrary(bookId) {
      try {
        const token = localStorage.getItem("token");

        // Find the book object
        const bookToRemove = this.books.find((book) => book.id === bookId);

        if (!bookToRemove) {
          throw new Error(`책을 찾을 수 없습니다: ${bookId}`);
        }

        // Debug information
        console.log("Book to remove:", bookToRemove);
        console.log("myBookId:", bookToRemove.myBookId);

        let deleteId;
        // Make sure we have a valid ID
        if (!bookToRemove.myBookId) {
          console.log("myBookId not found, trying to fetch fresh library data");
          // If myBookId is missing, try to refresh the library first
          await this.fetchMyLibraryBooks();

          // Check if we now have the book with myBookId
          const refreshedBook = this.books.find((book) => book.id === bookId);

          if (refreshedBook && refreshedBook.myBookId) {
            console.log("Found book after refresh with myBookId:", refreshedBook.myBookId);
            deleteId = refreshedBook.myBookId;
          } else {
            // As a last resort, try to delete with the book ID itself
            console.log("Still no myBookId after refresh, attempting with bookId");
            deleteId = bookId;
          }
        } else {
          deleteId = bookToRemove.myBookId;
        }

        console.log("Attempting to delete book with ID:", deleteId);

        // Use the exact API endpoint as specified in the documentation
        const response = await fetch(`${BASE_URL}/api/books/${deleteId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Update local state after successful server response
        this.books = this.books.filter((book) => book.id !== bookId);
        // Delete extracted cover image
        localStorage.removeItem(`book_cover_${bookId}`);
        ElMessage.success("책이 내 서재에서 삭제되었습니다.");
      } catch (error) {
        console.error("책 삭제 에러:", error);
        ElMessage.error("책을 내 서재에서 삭제하는데 실패했습니다.");
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

        // Perform local search (check if title or author contains query)
        this.searchResults = this.allBooks.filter(
          (book) =>
            book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query)
        );

        this.isSearching = false;
      } catch (error) {
        console.error("검색 중 오류 발생:", error);
        this.searchError = "검색 중 오류가 발생했습니다.";
        this.isSearching = false;
      }
    },
    isBookInLibrary(bookId) {
      return this.books.some((book) => book.id === bookId);
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

      // 이전 이야기 정보 초기화
      this.story = null;
      this.generatedImage = null;
      this.storyTab = "english";
      this.isHighlighted = false;

      try {
        // Select first 5 words without shuffling
        const selectedWords = this.vocabulary.slice(0, 5).map((word) => word.word);

        // Generate AI story
        const response = await vocabularyService.createStory(selectedWords);
        this.story = response;
      } catch (error) {
        console.error("이야기 생성 에러:", error);
        this.storyError = "이야기 생성에 실패했습니다.";
        ElMessage.error("이야기 생성에 실패했습니다.");
      } finally {
        this.isGeneratingStory = false;
      }
    },
    toggleWordCard(wordId) {
      this.flippedCards[wordId] = !this.flippedCards[wordId];
    },
    flipAllCards(showMeaning) {
      const newFlippedCards = {};
      this.vocabulary.forEach((word) => {
        newFlippedCards[word.id] = showMeaning;
      });
      this.flippedCards = newFlippedCards;
    },
    toggleHighlight() {
      this.isHighlighted = !this.isHighlighted;
    },
    async generateImage() {
      if (!this.story) {
        ElMessage.warning("먼저 AI 이야기를 생성해주세요.");
        return;
      }

      this.isGeneratingImage = true;
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/ai/create-comic`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            story: this.story.story,
          }),
        });

        const data = await response.json();
        console.log("API Response:", data); // 디버깅을 위한 로그 추가

        if (!response.ok) {
          throw new Error(data.message || "이미지 생성에 실패했습니다.");
        }

        // API 응답 구조 확인
        if (data && data.image_url) {
          this.generatedImage = data.image_url;
          this.story.aiImage = data.image_url;
          this.storyTab = "image";
          ElMessage.success("이미지가 생성되었습니다!");
        } else {
          console.error("Unexpected API response structure:", data);
          throw new Error("이미지 URL을 받아오지 못했습니다.");
        }
      } catch (error) {
        console.error("이미지 생성 에러:", error);
        ElMessage.error(error.message || "이미지 생성에 실패했습니다.");
      } finally {
        this.isGeneratingImage = false;
      }
    },
    async fetchAIStories() {
      try {
        this.loading = true;
        this.error = null;
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/api/v1/vocabulary/ai-stories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("AI 이야기를 불러오는데 실패했습니다.");
        }

        const stories = await response.json();
        this.aiStories = stories.map((story) => ({
          ...story,
          activeTab: "english",
          isHighlighted: false, // 각 이야기마다 하이라이트 상태 추가
        }));
      } catch (error) {
        console.error("AI 이야기 로딩 에러:", error);
        this.error = "AI 이야기를 불러오는데 실패했습니다.";
        ElMessage.error("AI 이야기를 불러오는데 실패했습니다.");
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    async saveStory() {
      if (!this.story) {
        ElMessage.warning("저장할 이야기가 없습니다.");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/api/v1/vocabulary/ai-stories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            wordList: this.story.used_words,
            englishStory: this.story.story,
            koreanStory: this.story.translation,
            aiImage: this.story.aiImage || this.generatedImage || null,
          }),
        });

        if (!response.ok) {
          throw new Error("이야기 저장에 실패했습니다.");
        }

        ElMessage.success("이야기가 저장되었습니다!");
        await this.fetchAIStories(); // AI 이야기 목록 새로고침
      } catch (error) {
        console.error("이야기 저장 에러:", error);
        ElMessage.error("이야기 저장에 실패했습니다.");
      }
    },
    getHighlightedStory(story) {
      if (!story.isHighlighted) return story.englishStory;

      let text = story.englishStory;
      const wordList = JSON.parse(story.wordList);
      wordList.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        text = text.replace(regex, `<span class="highlighted-word">$&</span>`);
      });
      return text;
    },
    toggleStoryHighlight(storyId) {
      const story = this.aiStories.find((s) => s.id === storyId);
      if (story) {
        story.isHighlighted = !story.isHighlighted;
      }
    },
    async deleteAIStory(storyId) {
      try {
        await this.$confirm("이 AI 이야기를 삭제하시겠습니까?", "AI 이야기 삭제", {
          confirmButtonText: "삭제",
          cancelButtonText: "취소",
          type: "warning",
        });

        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/api/v1/vocabulary/ai-stories/${storyId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("AI 이야기 삭제에 실패했습니다.");
        }

        ElMessage.success("AI 이야기가 삭제되었습니다.");
        await this.fetchAIStories(); // AI 이야기 목록 새로고침
      } catch (error) {
        if (error !== "cancel") {
          console.error("AI 이야기 삭제 에러:", error);
          ElMessage.error("AI 이야기 삭제에 실패했습니다.");
        }
      }
    },
    deleteBook(bookId) {
      if (confirm("이 책을 내 서재에서 삭제하시겠습니까?")) {
        this.removeBookFromLibrary(bookId);
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

.premium-badge {
  background-color: #117df8;
  color: white;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
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
  background-color: rgba(255, 255, 255, 0.9);
  color: #ff5252;
  border: none;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s;

  &:hover {
    background-color: #ff5252;
    color: white;
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

.book-publisher {
  margin: 0 0 15px 0;
  font-size: 13px;
  color: #888;
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

  .vocabulary-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .flip-button {
    background-color: #fff2b2;
    color: #333;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-size: 14px;

    &:hover {
      background-color: #ffe980;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  }

  .generate-story-button {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover:not(:disabled) {
      background-color: #45a049;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    &:disabled {
      background-color: #f5f5f5;
      color: #999;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }
}

.story-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  .story-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      color: #333;
      font-size: 18px;
    }

    .story-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .save-button-container {
      position: relative;
      display: inline-block;
    }

    .tooltip {
      visibility: hidden;
      position: absolute;
      bottom: -40px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.2s;

      &:after {
        content: "";
        position: absolute;
        top: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 0 6px 6px 6px;
        border-style: solid;
        border-color: transparent transparent #333 transparent;
      }
    }

    .save-button-container:hover .tooltip {
      visibility: visible;
      opacity: 1;
    }

    .save-story-button {
      background-color: #4caf50;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      font-size: 14px;

      &:hover:not(:disabled) {
        background-color: #45a049;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      &:disabled {
        background-color: #ccc;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
    }

    .highlight-button {
      background-color: #117df8;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      font-size: 14px;

      &:hover {
        background-color: #0c5aba;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }

  .story-content {
    .story-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;

      .story-tab {
        background: none;
        border: none;
        padding: 8px 16px;
        font-size: 14px;
        color: #666;
        cursor: pointer;
        position: relative;
        transition: all 0.2s;

        &:hover {
          color: #333;
        }

        &.active {
          color: #333;
          font-weight: 500;

          &:after {
            content: "";
            position: absolute;
            bottom: -11px;
            left: 0;
            width: 100%;
            height: 2px;
            background-color: #333;
          }
        }
      }
    }

    .story-text {
      margin-bottom: 16px;

      p {
        margin: 0;
        line-height: 1.8;
        font-size: 16px;
        color: #333;
      }
    }

    .used-words {
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
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-left-color: #117df8;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
  }

  p {
    color: #666;
    font-size: 16px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
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
  perspective: 1000px;
  cursor: pointer;
  height: 500px;
  position: relative;

  .card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.6s;
    transform-style: preserve-3d;

    &.is-flipped {
      transform: rotateY(180deg);
    }
  }

  .delete-vocabulary-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.9);
    color: #ff5252;
    border: none;
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: background-color 0.2s;

    &:hover {
      background-color: #ff5252;
      color: white;
    }
  }

  .card-front,
  .card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    background-color: white;
  }

  .card-back {
    transform: rotateY(180deg);
  }

  .word-header {
    height: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #eee;
    position: relative;
    z-index: 1;
  }

  .vocabulary-word {
    margin: 0;
    font-size: 32px;
    font-weight: 600;
    color: #333;
  }

  .word-content {
    height: calc(100% - 100px);
    padding: 20px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    gap: 15px;
    overflow-y: auto;

    p {
      margin: 0;
      padding: 15px 20px;
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      border-radius: 8px;
      background-color: #f8f9fa;
      border: 1px solid #eee;

      &.example-sentence {
        margin-bottom: 10px;
      }

      strong {
        display: block;
        color: #666;
        font-weight: 500;
        margin-bottom: 8px;
        font-size: 14px;
      }
    }
  }
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

:deep(.highlighted-word) {
  background-color: #fff2b2;
  padding: 2px 4px;
  border-radius: 2px;
}

.story-image {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;

  img {
    max-width: 100%;
    max-height: 500px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .generate-image-btn {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      background-color: #45a049;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  }

  .image-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;

    p {
      color: #666;
      font-size: 16px;
    }
  }
}

.aistories-section {
  margin-top: 20px;
}

.aistories-header {
  margin-bottom: 20px;

  h2 {
    font-size: 24px;
    color: #333;
    margin: 0;
  }
}

.aistories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 30px;
  padding: 10px;
}

.aistory-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
}

.delete-aistory-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  color: #ff5252;
  border: none;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s;

  &:hover {
    background-color: #ff5252;
    color: white;
  }
}

.aistory-content {
  padding: 20px;
}

.aistory-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;

  .aistory-tab {
    background: none;
    border: none;
    padding: 8px 16px;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;

    &:hover {
      color: #333;
    }

    &.active {
      color: #333;
      font-weight: 500;

      &:after {
        content: "";
        position: absolute;
        bottom: -11px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: #333;
      }
    }
  }
}

.aistory-text {
  margin-bottom: 20px;

  p {
    margin: 0;
    line-height: 1.8;
    font-size: 16px;
    color: #333;
  }
}

.aistory-image {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;

  img {
    max-width: 100%;
    max-height: 500px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .no-image {
    color: #666;
    font-size: 16px;
    text-align: center;
  }
}

.aistory-meta {
  padding-top: 20px;
  border-top: 1px solid #eee;

  p {
    margin: 0 0 15px 0;
    font-size: 14px;
    color: #666;
  }

  .used-words {
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

.empty-aistories {
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

.aistory-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 15px;

  .highlight-button {
    background-color: #117df8;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    font-size: 14px;

    &:hover {
      background-color: #0c5aba;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>
