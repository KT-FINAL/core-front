<template>
  <div class="signup-container">
    <div class="logo-container">
      <img :src="require('@/assets/Millie_Logo_kor.png')" alt="Millie Logo" class="logo" />
      <span class="plus-sign">+</span>
    </div>
    <h1 class="main-title">독서와 무제한 친해지리</h1>
    <p class="sub-title">회원가입 후 20만 권의 책을 만나보세요</p>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <form @submit.prevent="handleSignup" class="signup-form">
      <div class="form-group">
        <label for="username">아이디</label>
        <input
          type="text"
          id="username"
          v-model="username"
          class="form-control"
          placeholder="아이디 입력"
          required
        />
      </div>

      <div class="form-group">
        <label for="email">이메일</label>
        <input
          type="email"
          id="email"
          v-model="email"
          class="form-control"
          placeholder="이메일 입력"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">비밀번호</label>
        <input
          type="password"
          id="password"
          v-model="password"
          class="form-control"
          placeholder="비밀번호 입력"
          required
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">비밀번호 확인</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="confirmPassword"
          class="form-control"
          placeholder="비밀번호 재입력"
          required
        />
      </div>

      <button type="submit" class="signup-button" :disabled="isLoading">
        {{ isLoading ? "Creating account..." : "회원가입" }}
      </button>
    </form>

    <div class="login-link">이미 계정이 있으신가요? <router-link to="/">로그인</router-link></div>
  </div>
</template>

<script>
export default {
  name: "SignupView",
  data() {
    return {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      error: "",
      isLoading: false,
    };
  },
  methods: {
    handleSignup() {
      // Reset error
      this.error = "";

      // Validate form
      if (this.password !== this.confirmPassword) {
        this.error = "Passwords do not match";
        return;
      }

      // Set loading state
      this.isLoading = true;

      // Here you would typically call your authentication service
      // For now, we'll simulate a successful signup
      setTimeout(() => {
        this.isLoading = false;

        // Redirect to login page after successful signup
        this.$router.push("/");
      }, 1000);
    },
    goToLogin() {
      this.$router.push("/");
    },
  },
};
</script>

<style scoped lang="scss">
.signup-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: "Noto Sans KR", sans-serif;
}

.logo-container {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
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
  top: -2px; /* Slight adjustment to align with the logo text */
}

.main-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #333;
  text-align: left;
}

.sub-title {
  font-size: 18px;
  color: #666;
  margin-bottom: 30px;
  text-align: left;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;

  label {
    font-size: 14px;
    margin-bottom: 5px;
    color: #666;
  }

  input {
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;

    &::placeholder {
      color: #ccc;
    }

    &:focus {
      outline: none;
      border-color: #999;
    }
  }
}

.signup-button {
  background-color: #fff2b2;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 15px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #ffe980;
  }

  &:disabled {
    background-color: #f0f0f0;
    color: #999;
    cursor: not-allowed;
  }
}

.login-link {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  font-size: 14px;

  a {
    color: #666;
    text-decoration: none;
    margin-left: 5px;

    &:hover {
      text-decoration: underline;
    }
  }
}

.error-message {
  background-color: rgba(234, 67, 53, 0.1);
  color: var(--error-color);
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}
</style>
