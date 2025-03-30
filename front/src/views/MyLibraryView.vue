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

      <div v-if="activeTab === 'library'" class="empty-library">
        <p>아직 저장된 책이 없습니다.</p>
        <button class="browse-books-btn">책 둘러보기</button>
      </div>

      <div v-if="activeTab === 'vocabulary'" class="empty-vocabulary">
        <p>아직 저장된 단어가 없습니다.</p>
        <button class="browse-books-btn">책을 읽고 단어 추가하기</button>
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
    };
  },
  computed: {
    ...mapGetters(["userName"]),
  },
  methods: {
    handleLogout() {
      // Clear user data from localStorage
      this.$store.dispatch("logout");
      // Redirect to login page
      this.$router.push("/");
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
</style>
