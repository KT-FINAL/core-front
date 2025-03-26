import { createStore } from "vuex";

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem("user")) || null,
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
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
      // In a real app, you would make an API call here
      return new Promise((resolve) => {
        // Simulate API call
        setTimeout(() => {
          const user = {
            username: credentials.username,
            isLoggedIn: true,
          };
          commit("setUser", user);
          resolve(user);
        }, 1000);
      });
    },
    logout({ commit }) {
      commit("setUser", null);
    },
  },
  modules: {},
});
