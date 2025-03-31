<template>
  <div class="pdf-reader-container">
    <div class="pdf-viewer" @mouseup="handleTextSelection">
      <div v-if="pdfLoaded" class="dual-page-container" ref="pdfContainer">
        <template v-if="!useFallbackRendering">
          <div class="page-container">
            <canvas ref="pageCanvas1" class="page-canvas"></canvas>
          </div>
          <div class="page-container" v-if="currentPage + 1 <= numPages">
            <canvas ref="pageCanvas2" class="page-canvas"></canvas>
          </div>
        </template>
        <!-- Fallback container will be populated by renderWithFallback method -->
      </div>
      <div v-else class="loading-pdf">
        <p>Loading PDF...</p>
        <div class="pdf-diagnostic">
          <details>
            <summary>PDF Loading Diagnostic</summary>
            <p><strong>PDF Path:</strong> {{ pdfUrl }}</p>
            <p><strong>Resolved URL:</strong> {{ getPdfUrl() }}</p>
            <button @click="loadPDF" class="diagnostic-btn">Retry Loading PDF</button>
          </details>
        </div>
      </div>
    </div>
    <div v-if="selectedText" class="definition-panel">
      <div class="panel-header">
        <h3>{{ selectedText }}</h3>
        <button @click="selectedText = ''">×</button>
      </div>
      <div class="panel-content">
        <div v-if="isLoadingDefinition">단어 뜻을 불러오는 중...</div>
        <div v-else-if="definition">
          <div v-if="!isKoreanText(selectedText)" class="phonetic">{{ getPhonetic() }}</div>
          <div v-for="(meaning, index) in definition" :key="index">
            <p class="part-of-speech">{{ meaning.partOfSpeech }}</p>
            <ul>
              <li v-for="(def, i) in meaning.definitions" :key="i">
                <div class="definition-text">{{ def.definition }}</div>
                <div v-if="def.koreanTranslation" class="korean-translation">
                  {{ def.koreanTranslation }}
                </div>
                <div v-if="def.example" class="example">
                  <span class="example-label">예시:</span> {{ def.example }}
                </div>
              </li>
            </ul>
          </div>
          <button @click="saveWordToVocabulary" class="save-word-btn">단어장에 저장</button>
        </div>
        <div v-else-if="selectedText">단어 뜻을 찾을 수 없습니다.</div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import dictionaryService from "@/services/dictionary.js";

export default {
  name: "PDFReader",
  components: {},
  props: {
    pdfUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      pdfDoc: null,
      currentPage: 1,
      numPages: 1,
      selectedText: "",
      definition: null,
      wordData: null,
      isLoadingDefinition: false,
      pdfLoaded: false,
      scale: 1.2,
      useFallbackRendering: false,
      pdfIframe: null,
    };
  },
  mounted() {
    // Check if PDF.js is already loaded
    if (window.pdfjsLib) {
      console.log("PDF.js already loaded on mount, loading PDF");
      this.loadPDF();
    } else {
      console.log("PDF.js not yet loaded, setting up listener");

      // Set up an interval to check for PDF.js loading
      const checkInterval = setInterval(() => {
        if (window.pdfjsLib) {
          console.log("PDF.js detected as loaded, loading PDF");
          clearInterval(checkInterval);
          this.loadPDF();
        }
      }, 200);

      // Also set a timeout to prevent infinite checking
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.pdfjsLib) {
          console.error("Timed out waiting for PDF.js to load");
        }
      }, 10000);
    }
  },
  methods: {
    getPdfUrl() {
      // Log the original URL for debugging
      console.log("Original PDF URL:", this.pdfUrl);

      // Check if the URL is absolute
      if (this.pdfUrl.startsWith("http") || this.pdfUrl.startsWith("blob:")) {
        return this.pdfUrl;
      }

      // For paths starting with "/pdfs/", we need to handle spaces in filenames
      if (this.pdfUrl.startsWith("/pdfs/")) {
        const baseUrl = window.location.origin;
        const encodedPath = encodeURI(this.pdfUrl);
        console.log("Encoded URL:", `${baseUrl}${encodedPath}`);
        return `${baseUrl}${encodedPath}`;
      }

      // Convert relative path to absolute
      if (this.pdfUrl.startsWith("/")) {
        const baseUrl = window.location.origin;
        const encodedPath = encodeURI(this.pdfUrl);
        console.log("Encoded URL (absolute):", `${baseUrl}${encodedPath}`);
        return `${baseUrl}${encodedPath}`;
      }

      // Relative path without leading slash
      const baseUrl = window.location.origin;
      const encodedPath = encodeURI(this.pdfUrl);
      console.log("Encoded URL (relative):", `${baseUrl}/${encodedPath}`);
      return `${baseUrl}/${encodedPath}`;
    },
    async loadPDF() {
      this.pdfLoaded = false;

      try {
        const pdfUrl = this.getPdfUrl();
        console.log("Loading PDF from URL:", pdfUrl);

        // Wait for PDF.js to be loaded
        let pdfjsLib = window.pdfjsLib;
        let attempts = 0;
        const maxAttempts = 10;

        while (!pdfjsLib && attempts < maxAttempts) {
          console.log(`Waiting for PDF.js to load (attempt ${attempts + 1}/${maxAttempts})...`);
          await new Promise((resolve) => setTimeout(resolve, 500));
          pdfjsLib = window.pdfjsLib;
          attempts++;
        }

        if (!pdfjsLib) {
          console.error("PDF.js library not loaded properly after multiple attempts");
          return;
        }

        console.log("PDF.js loaded successfully, proceeding with PDF rendering");

        // Use fetch to get the PDF as an ArrayBuffer
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          console.error("Failed to fetch PDF:", response.status, response.statusText);
          return;
        }

        const pdfData = await response.arrayBuffer();

        // Skip the problematic PDF.js API calls and use the fallback renderer directly
        console.log("Using fallback rendering method due to PDF.js compatibility issues");
        this.useFallbackRendering = true;
        this.pdfLoaded = true;
        this.numPages = 100; // Arbitrary number since we can't determine actual count
        
        // Give Vue time to update the DOM before trying to manipulate it
        setTimeout(() => {
          this.renderWithFallback(pdfData);
        }, 100);
      } catch (error) {
        console.error("Error in PDF loading process:", error);
      }
    },
    async renderWithFallback(pdfData) {
      try {
        // Use a more direct approach to render PDF pages
        console.log('Rendering with fallback approach...');
        
        // Create temporary object URL from the PDF data
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(blob);
        
        // Wait for the next DOM update cycle before manipulating the DOM
        this.$nextTick(() => {
          console.log('Next tick, accessing DOM...');
          
          // Get the container reference directly from Vue
          const viewerElement = this.$refs.pdfContainer;
          console.log('Container element:', viewerElement);
          
          if (viewerElement) {
            // Create container and iframe
            const container = document.createElement('div');
            container.className = 'fallback-pdf-container';
            container.style.width = '100%';
            container.style.height = '100%';
            
            const iframe = document.createElement('iframe');
            iframe.src = `${objectUrl}#page=${this.currentPage}`;
            iframe.className = 'fallback-pdf-iframe';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
            
            // Clear any existing content
            viewerElement.innerHTML = '';
            viewerElement.appendChild(container);
            container.appendChild(iframe);
            
            console.log('Added iframe to container');
            
            // Add navigation controls to the iframe
            iframe.onload = () => {
              console.log('Iframe loaded');
              this.pdfIframe = iframe;
              
              try {
                // Try to access the iframe content
                const iframeDoc = iframe.contentWindow.document;
                
                // Inject custom CSS for better appearance
                const style = iframeDoc.createElement('style');
                style.textContent = `
                  body { margin: 0; padding: 0; }
                  .fallback-pdf-iframe { width: 100%; height: 100%; border: none; }
                  /* Override browser's default PDF viewer styles */
                  #outerContainer #mainContainer #viewerContainer { height: 100% !important; }
                  #outerContainer, #mainContainer, #viewerContainer { height: 100% !important; overflow: hidden !important; }
                  /* Make the PDF content larger */
                  .pdfViewer .page { transform: scale(1.2) !important; margin: 10px auto !important; }
                  /* Increase text size in annotations */
                  .annotationLayer { font-size: 1.2em !important; }
                `;
                iframeDoc.head.appendChild(style);
              } catch (e) {
                console.log("Could not access iframe content due to security restrictions");
              }
            };
          } else {
            console.error("Could not find container element - DOM might not be ready");
          }
        });
      } catch (error) {
        console.error("Error in fallback rendering:", error);
      }
    },
    async renderPages() {
      if (!this.pdfDoc || !this.pdfLoaded) return;

      try {
        // Use a cleaner approach that avoids private fields
        // Instead of directly calling getPage, we use a try/catch with Promise.all
        const pagePromises = [];
        
        // Add promise for the first page
        pagePromises.push(
          this.pdfDoc.getPage(this.currentPage)
            .then(page => this.renderPageToCanvas(page, this.$refs.pageCanvas1))
            .catch(error => {
              console.error(`Error getting page ${this.currentPage}:`, error);
            })
        );
        
        // Add promise for the second page if needed
        if (this.currentPage + 1 <= this.numPages) {
          pagePromises.push(
            this.pdfDoc.getPage(this.currentPage + 1)
              .then(page => this.renderPageToCanvas(page, this.$refs.pageCanvas2))
              .catch(error => {
                console.error(`Error getting page ${this.currentPage + 1}:`, error);
              })
          );
        }
        
        // Execute all page rendering promises
        await Promise.all(pagePromises);
      } catch (error) {
        console.error("Error in renderPages method:", error);
      }
    },
    async renderPageToCanvas(page, canvas) {
      if (!page || !canvas) {
        console.error("Missing page or canvas for rendering");
        return;
      }

      try {
        // Get page viewport at the desired scale
        const viewport = page.getViewport({ scale: this.scale });

        // Set canvas dimensions to match the viewport
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render the page to the canvas
        const renderContext = {
          canvasContext: canvas.getContext("2d"),
          viewport: viewport,
        };

        try {
          await page.render(renderContext).promise;
        } catch (renderError) {
          console.error("Error rendering page to canvas:", renderError);
        }
      } catch (error) {
        console.error("Error preparing page for rendering:", error);
      }
    },
    prevPage() {
      if (this.useFallbackRendering) {
        // In fallback mode, we try to control the iframe's PDF viewer
        try {
          const iframe = this.pdfIframe || this.$el.querySelector('.fallback-pdf-iframe');
          if (iframe) {
            if (this.currentPage > 1) {
              this.currentPage -= 2;
              if (this.currentPage < 1) this.currentPage = 1;
              
              // Update the iframe src with the new page parameter
              const currentSrc = iframe.src.split('#')[0]; // Get base URL without hash
              iframe.src = `${currentSrc}#page=${this.currentPage}`;
            }
          }
        } catch (e) {
          console.log("Could not navigate in fallback mode:", e);
        }
        return;
      }
      
      if (this.currentPage > 1) {
        this.currentPage -= 2;
        if (this.currentPage < 1) this.currentPage = 1;
        this.renderPages();
      }
    },
    nextPage() {
      if (this.useFallbackRendering) {
        // In fallback mode, we try to control the iframe's PDF viewer
        try {
          const iframe = this.pdfIframe || this.$el.querySelector('.fallback-pdf-iframe');
          if (iframe) {
            this.currentPage += 2;
            
            // Update the iframe src with the new page parameter
            const currentSrc = iframe.src.split('#')[0]; // Get base URL without hash
            iframe.src = `${currentSrc}#page=${this.currentPage}`;
          }
        } catch (e) {
          console.log("Could not navigate in fallback mode:", e);
        }
        return;
      }
      
      if (this.currentPage + 2 <= this.numPages) {
        this.currentPage += 2;
        this.renderPages();
      }
    },
    handleTextSelection() {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        console.log("Selected text:", selectedText);
        this.selectedText = selectedText;
        this.fetchDefinition(selectedText);
      }
    },
    async fetchDefinition(word) {
      this.isLoadingDefinition = true;
      this.definition = null;
      this.wordData = null;

      try {
        // Detect language (simple detection - can be improved)
        const isKorean = this.isKoreanText(word);
        console.log(`Detected language for "${word}": ${isKorean ? "Korean" : "English"}`);

        if (isKorean) {
          // Korean-Korean dictionary
          await this.fetchKoreanDefinition(word);
        } else {
          // English-Korean dictionary
          await this.fetchEnglishToKoreanDefinition(word);
        }
      } catch (error) {
        console.error("Error fetching definition:", error);
      } finally {
        this.isLoadingDefinition = false;
      }
    },
    isKoreanText(text) {
      // Check if the text contains Korean characters
      // Korean Unicode range: AC00-D7A3 (Hangul syllables)
      const koreanRegex = /[\uAC00-\uD7A3]/;
      return koreanRegex.test(text);
    },
    async fetchKoreanDefinition(word) {
      try {
        // Use our dictionary service for Korean word lookups
        const result = await dictionaryService.getKoreanDefinition(word);
        this.definition = result.meanings;
        this.wordData = result;
      } catch (error) {
        console.error("Error fetching Korean definition:", error);
      }
    },
    async fetchEnglishToKoreanDefinition(word) {
      try {
        // Use our dictionary service for English-Korean lookups
        const result = await dictionaryService.getEnglishToKoreanDefinition(word);
        this.definition = result.meanings;
        this.wordData = result;
      } catch (error) {
        console.error("Error fetching English-Korean definition:", error);
      }
    },
    saveWordToVocabulary() {
      // Get current timestamp
      const timestamp = new Date();

      // Detect language
      const isKorean = this.isKoreanText(this.selectedText);

      // Create vocabulary entry
      const vocabularyEntry = {
        word: this.selectedText,
        language: isKorean ? "ko" : "en",
        definition: this.definition,
        phonetic: this.wordData && this.wordData.phonetic ? this.wordData.phonetic : "",
        page: this.currentPage,
        bookId: this.pdfUrl.split("/").pop(),
        timestamp: timestamp.toISOString(),
        context: window.getSelection().toString(), // Get a bit more context if available
      };

      // Log the entry (in a real app, save to backend)
      console.log("Saving word to vocabulary:", vocabularyEntry);

      // Get existing vocabulary or initialize empty array
      let vocabulary = JSON.parse(localStorage.getItem("vocabulary") || "[]");

      // Add new entry
      vocabulary.push(vocabularyEntry);

      // Save to localStorage (temporary solution)
      localStorage.setItem("vocabulary", JSON.stringify(vocabulary));

      // Show confirmation (now with language-specific message)
      if (isKorean) {
        alert(`"${this.selectedText}" 단어가 단어장에 저장되었습니다.`);
      } else {
        alert(`The word "${this.selectedText}" has been saved to your vocabulary.`);
      }

      // Clear selection
      this.selectedText = "";
      this.definition = null;
    },
    getPhonetic() {
      if (!this.definition || !this.definition.length) {
        return "";
      }

      // If the word data includes phonetic information directly
      if (this.wordData && this.wordData.phonetic) {
        return this.wordData.phonetic;
      }

      return "";
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
}

.dual-page-container {
  display: flex;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100vh; /* Use full viewport height */
  margin: 0;
  padding: 0;
}

.page-container {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background-color: white;
}

.page-canvas {
  display: block;
}

.fallback-pdf-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
}

.fallback-pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.pdf-iframe {
  width: 100%;
  height: 100vh;
  border: none;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.pdf-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  height: 60px;
}

.book-navigation-title {
  margin: 0;
  font-size: 1.2rem;
  color: #4a4a4a;
}

.pdf-controls button {
  padding: 8px 16px;
  background-color: #4a4a4a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pdf-controls button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.pdf-viewer {
  display: flex;
  justify-content: center;
  background-color: #f9f9f9;
  overflow: hidden;
  flex-grow: 1;
  padding: 0;
  margin: 0;
}

.loading-pdf {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 100%;
  font-size: 18px;
  color: #666;
  background-color: #f0f0f0;
  border-radius: 8px;
  margin: 20px 0;
}

canvas {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.definition-panel {
  position: absolute;
  right: 20px;
  top: 80px;
  width: 300px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #4a4a4a;
  color: white;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-header button {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}

.panel-content {
  padding: 15px;
  overflow-y: auto;
  flex-grow: 1;
}

.part-of-speech {
  font-style: italic;
  color: #666;
  margin-bottom: 5px;
}

.example {
  margin-top: 5px;
  font-size: 0.9em;
  color: #555;
  padding-left: 15px;
}

.example-label {
  font-weight: bold;
  color: #333;
}

.save-word-btn {
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.save-word-btn:hover {
  background-color: #45a049;
}

.phonetic {
  font-style: italic;
  color: #666;
  margin-bottom: 5px;
}

.korean-translation {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.definition-text {
  margin-bottom: 5px;
}

.pdf-diagnostic {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.diagnostic-btn {
  background-color: #4a4a4a;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
}

.diagnostic-btn:hover {
  background-color: #333;
}
</style>
