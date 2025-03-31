import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./assets/main.css";

// Listen for route changes to configure PDF.js worker only on book reader page
router.beforeEach((to, from, next) => {
  if (to.name === "book-reader") {
    // Dynamically import PDF.js only when needed
    import("pdfjs-dist")
      .then((pdfjsLib) => {
        console.log("PDF.js loaded successfully, version:", pdfjsLib.version);
        window.pdfjsLib = pdfjsLib;

        // Set the worker source
        const workerSrc = `${process.env.BASE_URL}pdf.worker.js`;
        console.log("Setting PDF.js worker src to:", workerSrc);

        // Check if the worker file exists
        fetch(workerSrc, { method: "HEAD" })
          .then((response) => {
            if (!response.ok) {
              console.error("PDF.js worker file not found at:", workerSrc);
              console.error("Make sure the pdf.worker.js file exists in your public directory");
            } else {
              console.log("PDF.js worker file exists and is accessible");
            }
          })
          .catch((err) => {
            console.error("Error checking PDF.js worker file:", err);
          });

        // Configure PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      })
      .catch((error) => {
        console.error("Error loading PDF.js:", error);
      });
  }
  next();
});

createApp(App).use(store).use(router).mount("#app");
