import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";

const routes = [
  {
    path: "/",
    name: "login",
    component: LoginView,
    meta: {
      title: "로그인 | 밀리의 서재",
    },
  },
  {
    path: "/library",
    name: "library",
    component: () => import("../views/MyLibraryView.vue"),
    meta: {
      requiresAuth: true,
      title: "서재 | 밀리의 서재",
    },
  },
  {
    path: "/signup",
    name: "signup",
    component: () => import("../views/SignupView.vue"),
    meta: {
      title: "회원가입 | 밀리의 서재",
    },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Navigation guard to check authentication and set page title
router.beforeEach((to, from, next) => {
  // Set document title
  document.title = to.meta.title || "밀리의 서재";

  // Check authentication
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isLoggedIn = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")).isLoggedIn
    : false;

  if (requiresAuth && !isLoggedIn) {
    next("/");
  } else {
    next();
  }
});

export default router;
