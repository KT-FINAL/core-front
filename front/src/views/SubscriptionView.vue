<template>
  <div class="subscription-container">
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
      <h1 class="title">Premium 구독</h1>
      <p class="subtitle">AI 기반 단어 학습으로 더 효과적인 독서 경험을 만나보세요</p>

      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">📖</div>
          <h3>20만권 도서 제공</h3>
          <p>구독 시 다양한 장르의 20만권 이상의 도서 콘텐츠를 무제한으로 이용하실 수 있습니다.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🔍</div>
          <h3>AI 기반 단어 검색</h3>
          <p>문맥을 고려한 AI 단어 검색 기능으로 더 정확한 의미를 파악할 수 있습니다.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">💾</div>
          <h3>단어 저장 기능</h3>
          <p>검색한 단어를 저장하여 언제든지 다시 확인할 수 있습니다.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📚</div>
          <h3>AI 스토리 복습</h3>
          <p>저장한 단어를 활용하여 AI가 생성한 단편 스토리로 단어를 재미있게 복습하세요.</p>
        </div>
      </div>

      <div class="pricing-box">
        <div class="price-amount">
          <span class="price-currency">₩</span>
          <span class="price-number">9,900</span>
          <span class="price-period">/월</span>
        </div>
        <button class="subscribe-now-button" @click="goToPayment">지금 구독하기</button>
        <p class="price-note">* 언제든지 구독을 취소할 수 있습니다</p>
      </div>
    </div>
  </div>
</template>

<script>
import { userService, subscriptionService } from "@/services/api";

export default {
  name: "SubscriptionView",
  data() {
    return {
      userName: "User",
    };
  },
  async mounted() {
    try {
      // Validate user login status first
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      // If user is not logged in, redirect to login
      if (!storedUser.isLoggedIn || !storedUser.id) {
        console.warn("User is not logged in or missing ID. Redirecting to login.");
        localStorage.removeItem("user"); // Clean up invalid data
        this.$router.push("/");
        return;
      }

      // If checks pass, proceed with normal flow
      await this.fetchUserInfo();
      await this.checkSubscriptionStatus();
    } catch (error) {
      console.error("Error during component initialization:", error);
    }
  },
  methods: {
    async fetchUserInfo() {
      try {
        const userInfo = await userService.getUserInfo();
        this.userName = userInfo.name;
      } catch (error) {
        console.error("사용자 정보 로딩 에러:", error);
        const localUserInfo = JSON.parse(localStorage.getItem("user"));
        if (localUserInfo && localUserInfo.name) {
          this.userName = localUserInfo.name;
        }
      }
    },
    async checkSubscriptionStatus() {
      try {
        // Get stored user data first
        const storedUser = JSON.parse(localStorage.getItem("user")) || {};

        // If user is not logged in, or no user data is found, redirect to login
        if (!storedUser.isLoggedIn || !storedUser.id) {
          console.warn(
            "User not properly logged in or missing user ID. Redirecting to login page."
          );
          // Clear any invalid user data
          localStorage.removeItem("user");
          this.$router.push("/");
          return;
        }

        // If user is already marked as premium in localStorage, redirect to library
        if (storedUser.isPremium) {
          console.log("User is already marked as premium in localStorage, redirecting to library");
          this.$router.push("/library");
          return;
        }

        // Try to get user info from API, which will also check subscription
        let userInfo;
        try {
          userInfo = await userService.getUserInfo();
        } catch (apiError) {
          console.error("Failed to get user info from API:", apiError);
          // If API call fails but we have local user data, continue with that
          if (!storedUser.id) {
            console.warn("No valid user ID available. Redirecting to login page.");
            localStorage.removeItem("user");
            this.$router.push("/");
            return;
          }
        }

        if (userInfo && userInfo.isPremium) {
          console.log("User info API confirms premium status, redirecting to library");
          // Update localStorage before redirecting
          if (storedUser.id) {
            storedUser.isPremium = true;
            localStorage.setItem("user", JSON.stringify(storedUser));
          }
          this.$router.push("/library");
        } else {
          console.log("User is not premium according to API");

          // Try direct subscription check as a fallback
          try {
            if (storedUser.id) {
              console.log("Checking subscription status for member ID:", storedUser.id);
              // Direct subscription check (with retry and error handling built in)
              const subscription = await subscriptionService.getActiveSubscription(storedUser.id);

              if (subscription && subscription.id) {
                console.log(
                  "Direct subscription check found active subscription, redirecting to library"
                );
                storedUser.isPremium = true;
                localStorage.setItem("user", JSON.stringify(storedUser));
                this.$router.push("/library");
              }
            } else {
              console.warn("Cannot check subscription - no user ID available");
              // This should not happen due to the early check, but just in case
              this.$router.push("/");
            }
          } catch (subError) {
            console.error("Direct subscription check failed:", subError);
            // Stay on subscription page
          }
        }
      } catch (error) {
        console.error("구독 상태 확인 에러:", error);
        // If all attempts fail, redirect to login page
        this.$router.push("/");
      }
    },
    goToPayment() {
      this.$router.push("/payment");
    },
    handleLogout() {
      localStorage.removeItem("user");
      localStorage.removeItem("token"); // 토큰도 삭제
      this.$router.push("/");
    },
  },
};
</script>

<style scoped lang="scss">
.subscription-container {
  width: 100%;
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
  cursor: pointer;
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

.title {
  font-size: 36px;
  font-weight: 700;
  color: #333;
  margin: 0 0 10px 0;
  text-align: center;
}

.subtitle {
  font-size: 18px;
  color: #666;
  margin-bottom: 40px;
  text-align: center;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  margin-bottom: 50px;
}

.feature-card {
  background-color: #f9f9f9;
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  transition: transform 0.2s;
  max-width: 500px;
  margin: 0;

  &:hover {
    transform: translateY(-5px);
  }
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 15px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #333;
}

.feature-card p {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
}

.pricing-box {
  background-color: #fff2b2;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  margin: 0 auto 50px;
  max-width: 500px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.price-amount {
  margin-bottom: 15px;
}

.price-currency {
  font-size: 24px;
  font-weight: 600;
  vertical-align: top;
  position: relative;
  top: 8px;
}

.price-number {
  font-size: 48px;
  font-weight: 700;
}

.price-period {
  font-size: 18px;
  color: #666;
}

.subscribe-now-button {
  background-color: #117df8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 30px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #0c5aba;
  }
}

.price-note {
  font-size: 14px;
  color: #666;
  margin-top: 15px;
}

@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }

  .pricing-box {
    padding: 30px;
  }

  .price-number {
    font-size: 36px;
  }

  .title {
    font-size: 28px;
  }

  .subtitle {
    font-size: 16px;
  }
}
</style>
