<template>
  <div class="page-container">
    <div class="image-section">
      <img :src="require('@/assets/login.png')" alt="Login" class="login-image" />
    </div>
    <div class="login-section">
      <div class="login-container">
        <div class="logo-container">
          <img :src="require('@/assets/Millie_Logo_kor.png')" alt="Millie Logo" class="logo" />
          <span class="plus-sign">+</span>
        </div>
        <h1 class="main-title">독서와 무제한 친해지리</h1>
        <p class="sub-title">20만 권 속에서 인생책을 찾아보세요</p>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">이메일</label>
            <input
              type="email"
              id="email"
              v-model="email"
              placeholder="이메일 주소 입력"
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

          <button type="submit" class="login-button" :disabled="isLoading">
            {{ isLoading ? "로그인 중..." : "로그인" }}
          </button>

          <div class="login-options">
            <a href="#" @click.prevent="goToSignup">회원가입</a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { userService, subscriptionService } from "@/services/api";

export default {
  name: "LoginView",
  data() {
    return {
      email: "",
      password: "",
      error: "",
      isLoading: false,
    };
  },
  methods: {
    async handleLogin() {
      // Reset error
      this.error = "";
      // Set loading state
      this.isLoading = true;

      try {
        // Call the login API
        const response = await userService.login({
          email: this.email,
          password: this.password,
        });

        console.log("Login response:", response);

        // Validate member ID from login response
        if (!response.id) {
          console.error("Login response missing member ID:", response);
          this.error = "로그인 응답에 사용자 ID가 없습니다. 다시 시도해주세요.";
          this.isLoading = false;
          return;
        }

        // Convert ID to number if it's a string
        const userId = typeof response.id === "string" ? parseInt(response.id, 10) : response.id;
        if (isNaN(userId)) {
          console.error("Invalid user ID format:", response.id);
          this.error = "유효하지 않은 사용자 ID 형식입니다. 다시 시도해주세요.";
          this.isLoading = false;
          return;
        }

        // Store user data in localStorage
        const userData = {
          id: userId, // Store as number
          email: this.email,
          name: response.name || "User", // Default name if missing
          isLoggedIn: true,
          isPremium: response.isPremium || false, // Initialize isPremium from login response
        };

        // Save initial data to localStorage
        localStorage.setItem("user", JSON.stringify(userData));

        // Verify subscription status
        try {
          console.log("Verifying subscription status for member ID:", userData.id);
          let hasSubscription = false;

          // Check for active subscription first
          try {
            console.log("Checking active subscription for user:", userData.id);
            const activeSubscription = await subscriptionService.getActiveSubscription(userData.id);

            if (activeSubscription && activeSubscription.id) {
              hasSubscription = true;
              console.log("User has active subscription");
            } else {
              console.log("No active subscription found:", activeSubscription);
            }
          } catch (subError) {
            console.error("Error checking active subscription:", subError);
            // Continue to next check
          }

          // If no active subscription found, check all subscriptions
          if (!hasSubscription && userData.id) {
            try {
              console.log("No single active subscription found, checking all subscriptions...");
              const allSubscriptions = await subscriptionService.getAllSubscriptions(userData.id);
              console.log("All subscriptions response:", JSON.stringify(allSubscriptions));

              // Check if there are any subscriptions at all
              if (Array.isArray(allSubscriptions) && allSubscriptions.length > 0) {
                hasSubscription = true;
                console.log("Found subscriptions in history");
              }
            } catch (subError) {
              console.error("Error checking all subscriptions:", subError);
            }
          }

          // Update premium status based on subscription checks
          userData.isPremium = hasSubscription;
          console.log("Final premium status after all checks:", userData.isPremium);
        } catch (subError) {
          console.error("Error in subscription verification process:", subError);
          // If can't verify subscription, use the isPremium from login response as fallback
          userData.isPremium = response.isPremium || false;
          console.log("Using fallback premium status:", userData.isPremium);
        }

        // Save to localStorage with updated subscription status
        localStorage.setItem("user", JSON.stringify(userData));

        // Get complete user info including subscription status from API
        try {
          console.log("Fetching complete user info after login");
          const completeUserInfo = await userService.getUserInfo();

          // If the API returned subscription status, use it to update stored user data
          if (completeUserInfo && completeUserInfo.isPremium !== undefined) {
            console.log("User info API returned isPremium:", completeUserInfo.isPremium);
            userData.isPremium = completeUserInfo.isPremium;
            localStorage.setItem("user", JSON.stringify(userData));
          }
        } catch (infoError) {
          console.error("Error fetching complete user info:", infoError);
          // Continue with the login flow even if this fails
        }

        // Redirect based on subscription status
        if (userData.isPremium) {
          console.log("Redirecting to library (premium user)");
          this.$router.push("/library");
        } else {
          console.log("Redirecting to subscription page (non-premium user)");
          this.$router.push("/subscription");
        }
      } catch (error) {
        console.error("Login error:", error);

        // Check if the error is specifically about invalid credentials
        if (error.response?.status === 401) {
          this.error = "이메일 또는 비밀번호가 일치하지 않습니다.";
        } else if (error.serverError) {
          this.error = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else if (error.message) {
          this.error = error.message;
        } else {
          this.error = "로그인 중 오류가 발생했습니다.";
        }
      } finally {
        this.isLoading = false;
      }
    },
    goToSignup() {
      this.$router.push("/signup");
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

  .login-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.login-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #ffffff;
  min-width: 400px;
}

.login-container {
  width: 100%;
  max-width: 400px;
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
  top: -10px;
  color: #ff5252;
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
  margin-bottom: 5px;

  &:hover {
    background-color: #ffe980;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
}

.login-options {
  display: flex;
  justify-content: center;
  margin-top: 0;
  font-size: 16px;

  a {
    color: #888;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.error-message {
  background-color: rgba(234, 67, 53, 0.1);
  color: #ea4335;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}
</style>
