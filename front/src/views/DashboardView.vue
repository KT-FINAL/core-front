<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    <p>Welcome, {{ username }}!</p>
    <button @click="logout" class="logout-button">Logout</button>
  </div>
</template>

<script>
export default {
  name: "DashboardView",
  computed: {
    username() {
      return this.$store.state.user ? this.$store.state.user.username : "User";
    },
  },
  methods: {
    logout() {
      this.$store.dispatch("logout");
      this.$router.push("/");
    },
  },
};
</script>

<style scoped lang="scss">
.dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;

  h1 {
    margin-bottom: 20px;
  }

  .logout-button {
    margin-top: 20px;
    padding: 10px 15px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background-color: #d32f2f;
    }
  }
}
</style>
