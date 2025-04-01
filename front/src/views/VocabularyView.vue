<template>
  <div class="vocabulary-container">
    <h2>내 단어장</h2>
    <div v-if="loading" class="loading">
      <el-loading :fullscreen="false" />
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else class="word-list">
      <el-card v-for="word in words" :key="word.id" class="word-card">
        <div class="word-header">
          <h3>{{ word.word }}</h3>
          <el-button type="danger" size="small" @click="handleDelete(word.id)">삭제</el-button>
        </div>
        <div class="word-content">
          <p><strong>의미:</strong> {{ word.mean }}</p>
          <p><strong>예문:</strong> {{ word.example }}</p>
          <p><strong>동의어:</strong> {{ word.synonym }}</p>
          <p><strong>반의어:</strong> {{ word.antonym }}</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { vocabularyService } from "@/services/api";
import { ElMessage, ElMessageBox } from "element-plus";

export default {
  name: "VocabularyView",
  setup() {
    const words = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const fetchWords = async () => {
      try {
        loading.value = true;
        error.value = null;
        const response = await vocabularyService.getVocabularyList();
        words.value = Array.isArray(response) ? response : [];
      } catch (error) {
        console.error("단어장 로딩 에러:", error);
        error.value = "단어장을 불러오는데 실패했습니다.";
        ElMessage.error("단어장을 불러오는데 실패했습니다.");
      } finally {
        loading.value = false;
      }
    };

    const handleDelete = async (wordId) => {
      try {
        await ElMessageBox.confirm("이 단어를 삭제하시겠습니까?", "단어 삭제", {
          confirmButtonText: "삭제",
          cancelButtonText: "취소",
          type: "warning",
        });
        await vocabularyService.deleteWord(wordId);
        ElMessage.success("단어가 삭제되었습니다.");
        await fetchWords(); // 목록 새로고침
      } catch (error) {
        if (error !== "cancel") {
          console.error("단어 삭제 에러:", error);
          ElMessage.error("단어 삭제에 실패했습니다.");
        }
      }
    };

    onMounted(() => {
      fetchWords();
    });

    return {
      words,
      loading,
      error,
      handleDelete,
    };
  },
};
</script>

<style scoped>
.vocabulary-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.error {
  color: #f56c6c;
  text-align: center;
  padding: 20px;
}

.word-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.word-card {
  margin-bottom: 20px;
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.word-header h3 {
  margin: 0;
  color: #409eff;
}

.word-content {
  line-height: 1.6;
}

.word-content p {
  margin: 8px 0;
}

.word-content strong {
  color: #606266;
  margin-right: 8px;
}
</style>
