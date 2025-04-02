<template>
  <div class="fail-container">
    <div class="fail-message">
      <div class="fail-icon">✗</div>
      <h1>결제 처리 중 문제가 발생했습니다.</h1>
      <p>다시 시도하시거나 고객센터로 문의해 주세요.</p>
      <div class="button-group">
        <button @click="retryPayment" class="retry-button">다시 시도</button>
        <button @click="goToLibrary" class="cancel-button">취소</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FailView",
  methods: {
    retryPayment() {
      this.$router.push("/payment");
    },
    goToLibrary() {
      this.$router.push("/library");
    },
  },
};
</script>

<style scoped lang="scss">
.fail-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f8f9fa;
  font-family: "Noto Sans KR", sans-serif;
}

.fail-message {
  text-align: center;
  background-color: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.fail-icon {
  background-color: #ff5252;
  color: white;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  line-height: 80px;
  font-size: 40px;
  margin: 0 auto 20px;
}

h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 16px;
}

p {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.retry-button {
  background-color: #0064ff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #0052cc;
  }
}

.cancel-button {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #e8e8e8;
  }
}
</style>
