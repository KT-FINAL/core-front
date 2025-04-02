import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import SignupView from "../views/SignupView.vue";
import MyLibraryView from "../views/MyLibraryView.vue";
import BookReaderView from "../views/BookReaderView.vue";
import VocabularyView from "../views/VocabularyView.vue";
import SubscriptionView from "../views/SubscriptionView.vue";
import PaymentView from "@/views/PaymentView.vue";
import SuccessView from "@/views/SuccessView.vue";
import FailView from "@/views/FailView.vue";

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
      requiresAuth: true,
      requiresPremium: true,
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
      requiresAuth: true,
      requiresPremium: true,
      title: "책 읽기 | 밀리의 서재",
    },
    props: true,
  },
  {
    path: "/vocabulary",
    name: "vocabulary",
    component: VocabularyView,
    meta: {
      requiresAuth: true,
      requiresPremium: true,
      title: "단어장 | 밀리의 서재",
    },
  },
  {
    path: "/subscription",
    name: "subscription",
    component: SubscriptionView,
    meta: {
      requiresAuth: false,
      title: "프리미엄 구독 | 밀리의 서재",
    },
  },
  {
    path: "/payment",
    name: "payment",
    component: PaymentView,
  },
  {
    path: "/success",
    name: "success",
    component: SuccessView,
    meta: {
      requiresAuth: false,
      title: "결제 완료 | 밀리의 서재",
    },
  },
  {
    path: "/fail",
    name: "fail",
    component: FailView,
    meta: {
      requiresAuth: false,
      title: "결제 실패 | 밀리의 서재",
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

  // Get user info from localStorage
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

  const isLoggedIn = user ? user.isLoggedIn : false;
  const isPremium = user ? user.isPremium : false;

  // Check authentication requirement
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresPremium = to.matched.some((record) => record.meta.requiresPremium);

  // If route requires authentication and user is not logged in, redirect to login
  if (requiresAuth && !isLoggedIn) {
    next("/");
    return;
  }

  // If route requires premium and user is not premium, redirect to subscription page
  if (requiresPremium && !isPremium) {
    next("/subscription");
    return;
  }

  // Otherwise, proceed to the requested route
  next();
});

export default router;
