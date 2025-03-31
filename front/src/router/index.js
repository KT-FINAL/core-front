import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import SignupView from "../views/SignupView.vue";
import MyLibraryView from "../views/MyLibraryView.vue";
import BookReaderView from "../views/BookReaderView.vue";

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
    component: MyLibraryView,
    meta: {
      requiresAuth: false,
      title: "서재 | 밀리의 서재",
    },
  },
  {
    path: "/signup",
    name: "signup",
    component: SignupView,
    meta: {
      title: "회원가입 | 밀리의 서재",
    },
  },
  {
    path: "/book/:id",
    name: "BookReader",
    component: BookReaderView,
    meta: {
      requiresAuth: false,
      title: "책 읽기 | 밀리의 서재",
    },
    props: true,
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
