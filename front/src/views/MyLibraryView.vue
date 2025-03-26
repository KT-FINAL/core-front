<template>
  <div class="mylibrary-container">
    <div class="header">
      <div class="logo-container">
        <img :src="require('@/assets/Millie_Logo_kor.png')" alt="Millie Logo" class="logo" />
        <span class="plus-sign">+</span>
      </div>
      <div class="user-menu">
        <span class="username">{{ username }}님</span>
        <button @click="handleLogout" class="logout-button">로그아웃</button>
      </div>
    </div>

    <div class="content">
      <h1 class="main-title">내 서재</h1>
      <p class="welcome-message">{{ username }}님이 저장한 책이 여기에 표시됩니다.</p>

      <div class="empty-library">
        <p>아직 저장된 책이 없습니다.</p>
        <button class="browse-books-btn">책 둘러보기</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MyLibraryView",
  computed: {
    username() {
      return this.$store.state.user ? this.$store.state.user.username : "User";
    },
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

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  margin-right: 5px;
}

.plus-sign {
  font-size: 30px;
  font-weight: bold;
  line-height: 1;
  position: relative;
  top: -2px;
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

.main-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #333;
}

.welcome-message {
  color: #666;
  margin-bottom: 30px;
}

.empty-library {
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
