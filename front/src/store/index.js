import { createStore } from "vuex";

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem("user")) || null,
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    userName: (state) => state.user?.name || "User",
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    },
  },
  actions: {
    login({ commit }, credentials) {
      // Instead of API call, just create a mock user
      return new Promise((resolve) => {
        // Create dummy user data
        const user = {
          id: "user123",
          username: credentials.username || "Demo User",
          name: credentials.username || "Demo User",
          isLoggedIn: true,
        };
        commit("setUser", user);
        resolve(user);
      });
    },
    logout({ commit }) {
      commit("setUser", null);
    },
  },
  modules: {},
});
