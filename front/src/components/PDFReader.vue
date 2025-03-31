<template>
  <div class="pdf-reader-container">
    <div class="pdf-viewer" @mouseup="handleTextSelection">
      <div v-if="pdfLoaded" class="dual-page-container">
        <!-- Use an object tag with direct URL instead of dynamically creating elements -->
        <object
          :data="directPdfUrl"
          type="application/pdf"
          class="pdf-object"
          :key="objectKey"
          id="pdf-object"
        >
          <div class="pdf-fallback">
            <p>
              It appears your browser doesn't support embedded PDFs.
              <a :href="directPdfUrl" target="_blank">Click here to download the PDF</a>.
            </p>
          </div>
        </object>
      </div>
      <div v-else class="loading-pdf">
        <p>Loading PDF Viewer...</p>
        <div class="loading-spinner"></div>
        <p class="loading-message">
          If the PDF doesn't load automatically, the diagnostic tool below may help.
        </p>
        <div class="pdf-diagnostic">
          <details>
            <summary>PDF Loading Diagnostic</summary>
            <p><strong>PDF Path:</strong> {{ pdfUrl }}</p>
            <p><strong>Resolved URL:</strong> {{ directPdfUrl }}</p>
            <button @click="refreshPdf" class="diagnostic-btn">Retry Loading PDF</button>
          </details>
        </div>
      </div>

      <!-- Dictionary lookup button that appears when text is selected -->
      <div
        v-if="selectedText && !dictionaryOpen"
        class="dictionary-lookup-btn"
        @click="openDictionary"
      >
        <span>사전 찾기</span>
      </div>
    </div>

    <!-- Dictionary panel component -->
    <Dictionary
      :selected-word="selectedWord"
      :is-open="dictionaryOpen"
      :book-id="bookId"
      :page-number="currentPage"
      @close="closeDictionary"
      @retry="retryDictionaryLookup"
    />
  </div>
</template>

<script>
import Dictionary from "./Dictionary.vue";

export default {
  name: "PDFReader",
  components: {
    Dictionary,
  },
  props: {
    pdfUrl: {
      type: String,
      required: true,
    },
    bookId: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      pdfLoaded: false,
      loadAttempts: 0,
      objectKey: 0, // Used to force object refresh when needed
      selectedText: "",
      selectedWord: "",
      dictionaryOpen: false,
      currentPage: 1,
    };
  },
  computed: {
    directPdfUrl() {
      // Get the direct URL to the PDF with proper encoding
      const url = this.pdfUrl;

      // Check if the URL is absolute
      if (url.startsWith("http") || url.startsWith("blob:")) {
        return url;
      }

      // For paths starting with "/pdfs/" or any path, we need to handle spaces in filenames
      const baseUrl = window.location.origin;
      const encodedPath = encodeURI(url);

      // Add cache-busting parameter
      const cacheBuster = `?cacheBust=${Date.now()}`;
      return `${baseUrl}${encodedPath}${cacheBuster}`;
    },
  },
  mounted() {
    // Initialize PDF loading with a slight delay
    setTimeout(() => {
      this.initPdfLoading();
    }, 300);

    // Add event listener for key press to close dictionary with Escape key
    document.addEventListener("keydown", this.handleKeyPress);

    // Add event listener for page changes in the PDF
    this.setupPageChangeListener();
  },
  beforeUnmount() {
    // Clean up event listeners
    document.removeEventListener("keydown", this.handleKeyPress);
  },
  methods: {
    initPdfLoading() {
      console.log("Initializing PDF loading for:", this.directPdfUrl);
      this.pdfLoaded = true;

      // After showing the object, set up a listener to check if it loaded properly
      setTimeout(() => {
        this.checkPdfLoaded();
      }, 1000);
    },
    checkPdfLoaded() {
      // This may not always reliably detect loading issues
      // But it serves as a backup safety check
      const pdfObject = document.querySelector(".pdf-object");

      // If we could determine it's not loaded properly, try refreshing
      if (
        pdfObject &&
        pdfObject.contentDocument &&
        pdfObject.contentDocument.body &&
        pdfObject.contentDocument.body.innerHTML.includes("error")
      ) {
        console.log("PDF loading error detected, refreshing...");
        this.refreshPdf();
      } else {
        console.log("PDF appears to be loading correctly");
      }
    },
    refreshPdf() {
      // Force refresh by incrementing the key and rebuilding the object
      this.objectKey++;
      console.log(`Refreshing PDF (attempt ${this.loadAttempts + 1})...`);
      this.loadAttempts++;

      // Brief delay before showing the object again
      this.pdfLoaded = false;
      setTimeout(() => {
        this.pdfLoaded = true;
      }, 300);
    },
    handleTextSelection() {
      // Get the selected text
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text) {
        // Store the selected text
        this.selectedText = text;

        // For dictionary lookup, extract just the single word
        // Split by any whitespace or punctuation
        const cleanText = text.replace(/[.,;:!?()"{}[\]]/g, "");
        const words = cleanText.split(/\s+/);
        if (words.length > 0) {
          // Take the first word for dictionary lookup
          this.selectedWord = words[0];
          console.log("Selected word for dictionary:", this.selectedWord);
        }
      } else {
        // Clear selection if clicked elsewhere
        this.selectedText = "";

        // Don't clear selectedWord or close dictionary immediately
        // to allow interaction with the dictionary panel
      }
    },
    openDictionary() {
      if (this.selectedWord) {
        this.dictionaryOpen = true;
      }
    },
    closeDictionary() {
      this.dictionaryOpen = false;
    },
    retryDictionaryLookup() {
      // Force a retry of the dictionary lookup
      const currentWord = this.selectedWord;
      this.selectedWord = "";
      setTimeout(() => {
        this.selectedWord = currentWord;
      }, 10);
    },
    handleKeyPress(e) {
      // Close dictionary panel when Escape key is pressed
      if (e.key === "Escape" && this.dictionaryOpen) {
        this.closeDictionary();
      }
    },
    setupPageChangeListener() {
      // This is a simplified version - in a real implementation you would
      // use the PDF.js library to get accurate page information
      // For demo purposes, we'll simulate page tracking
      const checkPageInterval = setInterval(() => {
        // This is a placeholder - in reality, you would use PDF.js events
        // to detect actual page changes in the PDF viewer
        const randomPage = Math.floor(Math.random() * 200) + 1;
        this.currentPage = randomPage;
      }, 30000); // Check every 30 seconds for demo

      // Clean up interval on component unmount
      this.$options.beforeUnmount = () => {
        clearInterval(checkPageInterval);
        document.removeEventListener("keydown", this.handleKeyPress);
      };
    },
  },
};
</script>

<style scoped>
.pdf-reader-container {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  font-family: "Noto Sans KR", sans-serif;
}

.dual-page-container {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #f9f9f9;
}

/* Direct object PDF styling */
.pdf-object {
  width: 100%;
  height: 100%;
  border: none;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: white;
}

.pdf-fallback {
  padding: 20px;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.pdf-viewer {
  display: flex;
  justify-content: center;
  background-color: #f9f9f9;
  overflow: hidden;
  flex-grow: 1;
  padding: 20px;
  margin: 0;
  position: relative; /* For absolute positioning of dictionary button */
}

.loading-pdf {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 100%;
  max-width: 600px;
  font-size: 18px;
  color: #666;
  background-color: white;
  border-radius: 8px;
  margin: 20px auto;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.loading-pdf p {
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.pdf-diagnostic {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  width: 100%;
}

.pdf-diagnostic details {
  color: #666;
}

.pdf-diagnostic summary {
  cursor: pointer;
  padding: 10px 0;
  font-weight: 500;
  color: #333;
}

.diagnostic-btn {
  background-color: #fff2b2;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 10px;
  transition: all 0.2s;
}

.diagnostic-btn:hover {
  background-color: #ffe980;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #fff2b2;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 2s linear infinite;
  margin: 20px 0;
}

.loading-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

/* Dictionary lookup button styling */
.dictionary-lookup-btn {
  position: fixed;
  right: 30px;
  top: 100px;
  background-color: #ff5252;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
  transition: all 0.2s;
}

.dictionary-lookup-btn:hover {
  background-color: #ff3232;
  transform: translateY(-2px);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
