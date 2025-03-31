<template>
  <div class="pdf-reader-container">
    <div class="pdf-viewer">
      <div v-if="pdfLoaded" class="dual-page-container">
        <!-- PDF iframe with better interaction -->
        <iframe :src="directPdfUrl" class="pdf-object" :key="objectKey" id="pdf-object">
          <div class="pdf-fallback">
            <p>
              It appears your browser doesn't support embedded PDFs.
              <a :href="directPdfUrl" target="_blank">Click here to download the PDF</a>.
            </p>
          </div>
        </iframe>

        <!-- Modified text selection overlay to allow PDF interaction -->
        <div
          class="text-selection-overlay"
          @mouseup="handleTextSelection"
          @mousedown="startSelection"
          @mousemove="trackSelection"
        >
          <div v-if="isSelecting" class="selection-highlight"></div>
        </div>
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

      <!-- Selection indicator that appears briefly when text is selected -->
      <div v-if="selectionActive" class="selection-indicator">
        <div class="selection-dot"></div>
        <span>Text selected</span>
      </div>
    </div>

    <!-- Dictionary panel component -->
    <Dictionary
      :selected-word="selectedWord"
      :selected-text="selectedText"
      :context-paragraph="contextParagraph"
      :is-open="dictionaryOpen"
      :book-id="bookId"
      :book-info="bookInfo"
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
    bookInfo: {
      type: Object,
      default: () => ({
        title: "Unknown Book",
        author: "Unknown Author",
      }),
    },
  },
  data() {
    return {
      pdfLoaded: false,
      loadAttempts: 0,
      objectKey: 0, // Used to force object refresh when needed
      selectedText: "",
      selectedWord: "",
      contextParagraph: "",
      dictionaryOpen: false,
      currentPage: 1,
      selectionActive: false,
      selectionTimer: null,
      isSelecting: false, // Track active selection state
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
    hasSelectedText() {
      return !!this.selectedText;
    },
  },
  mounted() {
    // Initialize PDF loading with a slight delay
    setTimeout(() => {
      this.initPdfLoading();
    }, 300);

    // Add event listener for key press to close dictionary with Escape key
    document.addEventListener("keydown", this.handleKeyPress);

    // For debugging
    console.log("PDFReader component mounted");

    // Add a document-level mouse listener on mount to ensure we catch selections
    this.setupSelectionListeners();
  },
  beforeUnmount() {
    // Clean up event listeners
    document.removeEventListener("keydown", this.handleKeyPress);
    document.removeEventListener("mouseup", this.handleGlobalSelection);

    // Try to clean up PDF object document listeners
    try {
      const pdfObject = document.getElementById("pdf-object");
      if (pdfObject && pdfObject.contentDocument) {
        pdfObject.contentDocument.removeEventListener("mouseup", this.handleTextSelection);
      }
    } catch (e) {
      console.log("Could not clean up PDF object event listeners", e);
    }

    // Clean up any timers
    if (this.selectionTimer) {
      clearTimeout(this.selectionTimer);
    }

    console.log("PDFReader component unmounted - cleaned up event listeners");
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
    startSelection() {
      // Start tracking selection
      this.isSelecting = true;

      // Add selecting class to overlay to capture events during selection
      const overlay = document.querySelector(".text-selection-overlay");
      if (overlay) {
        overlay.classList.add("selecting");
      }

      console.log("Selection started");
    },
    handleTextSelection() {
      // End selection tracking
      this.isSelecting = false;

      // Remove selecting class to allow normal PDF interaction
      const overlay = document.querySelector(".text-selection-overlay");
      if (overlay) {
        overlay.classList.remove("selecting");
      }

      // Force check for selection
      setTimeout(() => {
        // Get the selected text from both main document and iframe
        let text = "";
        try {
          const pdfObject = document.getElementById("pdf-object");
          if (pdfObject) {
            const iframeDoc = pdfObject.contentDocument || pdfObject.contentWindow.document;
            if (iframeDoc) {
              const iframeSelection = iframeDoc.getSelection();
              text = iframeSelection?.toString().trim() || "";
            }
          }
        } catch (e) {
          console.log("Could not access iframe selection", e);
        }

        // Fallback to main document selection if no iframe selection
        if (!text) {
          const selection = window.getSelection();
          text = selection?.toString().trim() || "";
        }

        console.log("Text selection detected:", text ? text.substring(0, 20) + "..." : "None");

        if (text) {
          // Process any valid text selection
          this.selectedText = text;
          console.log("Processing text selection:", text);

          // Attempt to get surrounding paragraph content for context
          this.getContextParagraph(window.getSelection());

          // For dictionary lookup, extract just the single word
          // Split by any whitespace or punctuation
          const cleanText = text.replace(/[.,;:!?()"{}[\]]/g, "");
          const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
          if (words.length > 0) {
            // Take the first word for dictionary lookup
            this.selectedWord = words[0];
            console.log("Selected word for dictionary:", this.selectedWord);
          } else {
            this.selectedWord = text; // Fallback if no words found
          }

          // Show brief visual feedback
          this.showSelectionFeedback();

          // Automatically open the dictionary panel when text is selected
          this.dictionaryOpen = true;
        }
      }, 100);
    },
    showSelectionFeedback() {
      // Show visual feedback that text was selected
      this.selectionActive = true;

      // Clear any existing timer
      if (this.selectionTimer) {
        clearTimeout(this.selectionTimer);
      }

      // Hide after a delay
      this.selectionTimer = setTimeout(() => {
        this.selectionActive = false;
      }, 1500);
    },
    getContextParagraph(selection) {
      // Try to get the paragraph containing the selection
      try {
        if (selection.anchorNode && selection.anchorNode.parentNode) {
          // Find the closest paragraph-like container
          let container = selection.anchorNode;

          // Try to find a decent-sized text node or paragraph
          while (
            container &&
            container.textContent &&
            container.textContent.length < 100 &&
            container.parentNode &&
            container.parentNode.textContent.length < 500
          ) {
            container = container.parentNode;
          }

          // Get the text content of this container, limited to a reasonable size
          let paragraph = container.textContent || "";
          if (paragraph.length > 500) {
            // Truncate long paragraphs
            paragraph = paragraph.substring(0, 500) + "...";
          }

          this.contextParagraph = paragraph.trim();
          console.log("Context paragraph:", this.contextParagraph);
        }
      } catch (error) {
        console.error("Error getting context paragraph:", error);
        this.contextParagraph = "";
      }
    },
    openDictionary() {
      if (this.selectedWord) {
        this.dictionaryOpen = true;
      }
    },
    closeDictionary() {
      this.dictionaryOpen = false;
      this.selectedText = "";
      this.selectedWord = "";
      this.contextParagraph = "";
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
    trackSelection() {
      // Track mouse movements during selection
      if (this.isSelecting) {
        // Keep the overlay in selecting mode during active selection
        const overlay = document.querySelector(".text-selection-overlay");
        if (overlay && !overlay.classList.contains("selecting")) {
          overlay.classList.add("selecting");
        }
      }
    },
    // Add a document-level mouse listener on mount to ensure we catch selections
    setupSelectionListeners() {
      // Using setTimeout to ensure it runs after Vue setup
      setTimeout(() => {
        // Add a global mouseup listener to catch all selections
        document.addEventListener("mouseup", this.handleGlobalSelection);

        // Try to directly access the PDF iframe
        try {
          const pdfObject = document.getElementById("pdf-object");
          if (pdfObject) {
            // For iframe content, we need to wait for it to load
            pdfObject.addEventListener("load", () => {
              try {
                // Add event listeners to the iframe's document
                const iframeDoc = pdfObject.contentDocument || pdfObject.contentWindow.document;
                if (iframeDoc) {
                  iframeDoc.addEventListener("mouseup", this.handleTextSelection);

                  // Set better styles for the PDF content
                  const style = iframeDoc.createElement("style");
                  style.textContent =
                    "* { -webkit-user-select: text !important; user-select: text !important; }";
                  iframeDoc.head.appendChild(style);

                  console.log("Added event listeners to PDF iframe document");
                }
              } catch (e) {
                console.log("Could not access PDF iframe document on load", e);
              }
            });
          }
        } catch (e) {
          console.log("Could not access PDF iframe directly", e);
        }
      }, 1000);
    },
    handleGlobalSelection() {
      // Check if there's any selection, regardless of where it happened
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || "";

        if (text) {
          console.log("Global selection detected:", text);
          this.processTextSelection(selection, text);
        }
      }, 100);
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
  position: relative;
  overflow: hidden; /* Contain internal scroll */
}

/* Text selection overlay */
.text-selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10; /* Higher z-index to ensure it's on top */
  pointer-events: none; /* Allow interactions to pass through to PDF */
  cursor: text; /* Show text selection cursor */
  background-color: transparent; /* Make completely transparent */
}

/* Only capture pointer events during active selection */
.text-selection-overlay.selecting {
  pointer-events: auto;
  background-color: rgba(255, 255, 255, 0.01); /* Slightly visible to ensure event capture */
}

.selection-highlight {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

/* Direct object PDF styling */
.pdf-object {
  width: 100%;
  height: 100%;
  border: none;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: white;
  position: relative;
  z-index: 1;
  overflow: auto; /* Enable scrolling */
}

/* Override any PDF viewer controls - ensure they're visible and interactive */
.pdf-object::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.pdf-object::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.pdf-object::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 8px;
}

.pdf-object::-webkit-scrollbar-thumb:hover {
  background: #555;
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
  position: relative;
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

/* Selection indicator styling */
.selection-indicator {
  position: fixed;
  right: 30px;
  top: 100px;
  background-color: rgba(255, 82, 82, 0.9);
  color: white;
  border-radius: 4px;
  padding: 8px 15px;
  font-size: 14px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
  animation: fadeInOut 1.5s ease-in-out;
}

.selection-dot {
  width: 8px;
  height: 8px;
  background-color: white;
  border-radius: 50%;
  margin-right: 8px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  15% {
    opacity: 1;
    transform: translateY(0);
  }
  85% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
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
