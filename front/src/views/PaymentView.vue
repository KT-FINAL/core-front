<template>
  <div class="payment-container">
    <div class="header">
      <div class="elogo-container">
        <img :src="require('@/assets/Millie_Logo_Eng.png')" alt="Millie Logo Eng" class="elogo" />
        <span class="plus-sign">+</span>
      </div>
      <div class="user-menu">
        <span class="username">{{ userName }}님</span>
      </div>
    </div>

    <div class="content">
      <h1 class="title">Premium 구독 결제</h1>
      <div class="payment-provider">
        <p class="subtitle">안전한 결제를 위해</p>
        <img :src="require('@/assets/Toss_Logo_Primary.png')" alt="Toss Logo" class="toss-logo" />
        <p class="subtitle">를 통해 진행됩니다</p>
      </div>

      <div class="payment-box">
        <div class="payment-info">
          <div class="price-amount">
            <span class="price-currency">₩</span>
            <span class="price-number">9,900</span>
            <span class="price-period">/월</span>
          </div>
          <p class="price-note">* 매월 자동으로 결제됩니다</p>
        </div>

        <button class="payment-button" @click="requestBillingAuth">카드 등록하기</button>
      </div>
    </div>
  </div>
</template>

<script>
import { userService } from "@/services/api";

export default {
  name: "PaymentView",
  data() {
    return {
      userName: "User",
      tossPayments: null,
      payment: null,
    };
  },
  async mounted() {
    await this.fetchUserInfo();
    this.initializeTossPayments();
    this.checkPremiumStatus();
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
    // Check if user is already premium, if so redirect to library
    async checkPremiumStatus() {
      try {
        const userInfo = await userService.getUserInfo();
        if (userInfo.isPremium) {
          // If user is already premium, redirect to library
          this.$router.push("/library");
        }
      } catch (error) {
        console.error("프리미엄 상태 확인 중 오류 발생:", error);
      }
    },
    initializeTossPayments() {
      // TOSS SDK 초기화
      const clientKey = "test_ck_DnyRpQWGrN50KxqNg6QeVKwv1M9E";
      const customerKey = "vpmZrcR_urVsV_6caqYKz"; // This should be unique per user
      this.tossPayments = window.TossPayments(clientKey);
      this.payment = this.tossPayments.payment({ customerKey });
    },
    async requestBillingAuth() {
      try {
        await this.payment.requestBillingAuth({
          method: "CARD",
          successUrl: window.location.origin + "/success",
          failUrl: window.location.origin + "/fail",
          customerEmail: "customer123@gmail.com", // This should be the actual user's email
          customerName: this.userName,
        });
      } catch (error) {
        console.error("결제 요청 중 오류 발생:", error);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.payment-container {
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

.back-button {
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
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 36px;
  font-weight: 700;
  color: #333;
  margin: 0 0 20px 0;
}

.payment-provider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
}

.subtitle {
  font-size: 18px;
  color: #666;
  margin: 0;
}

.toss-logo {
  height: 80px;
  margin: 10px 0;
}

.payment-box {
  background-color: #f8f9fa;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.payment-info {
  margin-bottom: 30px;
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

.price-note {
  font-size: 14px;
  color: #666;
}

.payment-button {
  background-color: #0064ff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px 40px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 20px;
  width: 100%;

  &:hover {
    background-color: #0052cc;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 28px;
  }

  .subtitle {
    font-size: 16px;
  }

  .price-number {
    font-size: 36px;
  }
}
</style>
