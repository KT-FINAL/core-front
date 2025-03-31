<template>
  <div class="pdf-reader-container">
    <div class="pdf-viewer">
      <div v-if="pdfLoaded" class="dual-page-container">
        <!-- Use an object tag with direct URL instead of dynamically creating elements -->
        <object :data="directPdfUrl" type="application/pdf" class="pdf-object" :key="objectKey">
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
    </div>
  </div>
</template>

<script>
export default {
  name: "PDFReader",
  props: {
    pdfUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      pdfLoaded: false,
      loadAttempts: 0,
      objectKey: 0, // Used to force object refresh when needed
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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
