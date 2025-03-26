<template>
  <div class="login-container">
    <div class="logo-container">
      <img :src="require('@/assets/Millie_Logo_kor.png')" alt="Millie Logo" class="logo" />
      <span class="plus-sign">+</span>
    </div>
    <h1 class="main-title">독서와 무제한 친해지리</h1>
    <p class="sub-title">20만 권 속에서 인생책을 찾아보세요</p>

    <form @submit.prevent="handleLogin" class="login-form">
      <div class="form-group">
        <label for="username">아이디</label>
        <input
          type="text"
          id="username"
          v-model="username"
          placeholder="아이디 혹은 휴대폰 번호 입력"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">비밀번호</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="비밀번호 입력"
          required
        />
      </div>

      <button type="submit" class="login-button">로그인</button>

      <div class="login-options">
        <a href="#" @click.prevent="goToSignup">회원가입</a>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: "LoginView",
  data() {
    return {
      username: "",
      password: "",
    };
  },
  methods: {
    handleLogin() {
      // For now, just log the credentials
      console.log("Login attempt with:", this.username, this.password);

      // In a real implementation, you would call your authentication API
      // this.$store.dispatch('auth/login', { username: this.username, password: this.password })
      //   .then(() => this.$router.push('/dashboard'))
      //   .catch(error => console.error('Login failed:', error));

      // For standalone testing, we can use localStorage to simulate login
      localStorage.setItem(
        "user",
        JSON.stringify({
          username: this.username,
          isLoggedIn: true,
        })
      );

      // Redirect to home/dashboard
      this.$router.push("/dashboard");
    },
    goToSignup() {
      this.$router.push("/signup");
    },
  },
};
</script>

<style scoped lang="scss">
.login-container {
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

.login-form {
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

.login-button {
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
}

.login-options {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  font-size: 14px;

  a {
    color: #666;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
