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
import { subscriptionService } from "@/services/api";

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
router.beforeEach(async (to, from, next) => {
  // Set document title
  document.title = to.meta.title || "밀리의 서재";

  // Get user info from localStorage
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

  const isLoggedIn = user ? user.isLoggedIn : false;
  let isPremium = user ? user.isPremium : false;

  // Check if user is coming from payment success
  const paymentSuccess = sessionStorage.getItem("paymentSuccess");

  // Check authentication requirement
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresPremium = to.matched.some((record) => record.meta.requiresPremium);

  // If route requires authentication and user is not logged in, redirect to login
  if (requiresAuth && !isLoggedIn) {
    next("/");
    return;
  }

  // If route requires premium, verify subscription status from API
  if (requiresPremium && isLoggedIn) {
    try {
      // Ensure we have a valid user ID
      if (!user.id) {
        console.error("Navigation guard: Missing user ID for subscription check");
        next("/subscription");
        return;
      }

      // Validate the user ID
      const memberId = user.id;
      if (typeof memberId !== "number") {
        console.error("Navigation guard: Invalid user ID format - expected a number:", memberId);
        // Clear invalid user data
        localStorage.removeItem("user");
        next("/");
        return;
      }

      console.log("Navigation guard: Checking subscription for user ID:", memberId);

      // Allow access for users coming from payment success
      if (paymentSuccess === "true") {
        console.log(
          "Payment success flag detected - bypassing subscription checks and allowing access"
        );
        // Clear the flag after use to ensure it's only used once
        sessionStorage.removeItem("paymentSuccess");
        next();
        return;
      }

      // First try to get active subscription
      let activeSubscription = null;
      try {
        activeSubscription = await subscriptionService.getActiveSubscription(memberId);
        console.log("Navigation guard: Active subscription response:", activeSubscription);
      } catch (subError) {
        console.error("Navigation guard: Error checking active subscription:", subError);
      }

      // Check if we have an active subscription
      let foundActiveSubscription = !!(activeSubscription && activeSubscription.id);

      // If no active subscription found, try to get all subscriptions
      if (!foundActiveSubscription) {
        try {
          console.log(
            "Navigation guard: No active subscription found, checking subscription history..."
          );
          const subscriptions = await subscriptionService.getAllSubscriptions(memberId);
          console.log("Navigation guard: All subscriptions response:", subscriptions);

          // If we have any subscriptions at all, consider user as premium
          foundActiveSubscription = Array.isArray(subscriptions) && subscriptions.length > 0;
          if (foundActiveSubscription) {
            console.log("Navigation guard: Found subscriptions in history, marking as premium");
          }
        } catch (subError) {
          console.error("Navigation guard: Error checking all subscriptions:", subError);
        }
      }

      // Update isPremium based on our findings
      isPremium = foundActiveSubscription;
      console.log("Navigation guard: isPremium after comprehensive check:", isPremium);

      // Update localStorage with latest premium status
      if (user.isPremium !== isPremium) {
        user.isPremium = isPremium;
        localStorage.setItem("user", JSON.stringify(user));
        console.log("Updated premium status in localStorage:", isPremium);
      }

      // If subscription check shows user is not premium, redirect to subscription page
      if (!isPremium) {
        console.log(
          "Navigation guard: User does not have active subscription, redirecting to subscription page"
        );
        next("/subscription");
        return;
      }
    } catch (error) {
      console.error("Error verifying subscription status:", error);
      // Don't assume premium on server error - always redirect to subscription page
      console.log("Subscription verification failed - redirecting to subscription page");
      isPremium = false;

      // Update localStorage to reflect non-premium status
      if (user) {
        user.isPremium = false;
        localStorage.setItem("user", JSON.stringify(user));
      }
    }
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
