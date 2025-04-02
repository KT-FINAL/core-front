<template>
  <div class="page-container">
    <div class="image-section">
      <img :src="require('@/assets/signup.png')" alt="Signup" class="signup-image" />
    </div>
    <div class="signup-section">
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
            <label for="name">이름</label>
            <input
              type="text"
              id="name"
              v-model="name"
              class="form-control"
              placeholder="이름 입력"
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
            <label for="phone">휴대폰 번호</label>
            <input
              type="tel"
              id="phone"
              v-model="phone"
              class="form-control"
              placeholder="휴대폰 번호 입력"
              required
              pattern="[0-9]{3}-[0-9]{4}-[0-9]{4}"
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

        <div class="login-link">
          이미 계정이 있으신가요? <router-link to="/">로그인</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { userService } from "@/services/api";

export default {
  name: "SignupView",
  data() {
    return {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      error: "",
      isLoading: false,
    };
  },
  methods: {
    async handleSignup() {
      // Reset error
      this.error = "";

      // Validate form
      if (this.password !== this.confirmPassword) {
        this.error = "비밀번호가 일치하지 않습니다";
        return;
      }

      // Validate phone number format
      const phoneRegex = /^[0-9]{3}-[0-9]{4}-[0-9]{4}$/;
      if (!phoneRegex.test(this.phone)) {
        this.error = "올바른 휴대폰 번호 형식이 아닙니다 (예: 010-1234-5678)";
        return;
      }

      // Set loading state
      this.isLoading = true;

      try {
        // Call the registration API
        await userService.register({
          email: this.email,
          name: this.name,
          phone: this.phone,
          password: this.password,
        });

        // Login the user automatically after registration
        const loginResponse = await userService.login({
          email: this.email,
          password: this.password,
        });

        // Store user data in localStorage
        const userData = {
          id: loginResponse.id,
          email: this.email,
          name: this.name,
          isLoggedIn: true,
          isPremium: false, // New users are not premium by default
        };

        // Save to localStorage
        localStorage.setItem("user", JSON.stringify(userData));

        // Redirect to subscription page after successful signup
        this.$router.push("/subscription");
      } catch (error) {
        this.error = error.message || "회원가입 중 오류가 발생했습니다.";
      } finally {
        this.isLoading = false;
      }
    },
    goToLogin() {
      this.$router.push("/");
    },
  },
};
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.image-section {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  overflow: hidden;

  .signup-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.signup-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #ffffff;
  min-width: 400px;
}

.signup-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  font-family: "Noto Sans KR", sans-serif;
}

.logo-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.logo {
  height: 32px;
  margin-right: 5px;
}

.plus-sign {
  font-size: 30px;
  font-weight: bold;
  line-height: 1;
  position: relative;
  top: -10px;
  color: #ff5252;
}

.main-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;
  color: #333;
  text-align: left;
}

.sub-title {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
  text-align: left;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group {
  display: flex;
  flex-direction: column;

  label {
    font-size: 13px;
    margin-bottom: 3px;
    color: #666;
  }

  input {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;

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
  padding: 12px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 5px;
  margin-bottom: 5px;

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
  margin-top: 10px;
  font-size: 14px;

  a {
    color: #888;
    text-decoration: none;
    margin-left: 5px;

    &:hover {
      text-decoration: underline;
    }
  }
}

.error-message {
  background-color: rgba(234, 67, 53, 0.1);
  color: #ea4335;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 13px;
  text-align: center;
}
</style>
