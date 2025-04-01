<template>
  <div class="pdf-viewer-container">
    <div class="pdf-controls">
      <button @click="prevPage" :disabled="currentPage <= 1" class="page-button">이전</button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage >= totalPages" class="page-button">
        다음
      </button>
    </div>

    <div class="pdf-document" ref="pdfContainer">
      <div class="page-container">
        <img ref="pdfImage" v-if="pageDataUrl" :src="pageDataUrl" class="pdf-image" />
        <canvas ref="pdfCanvas" :class="{ hidden: pageDataUrl }"></canvas>
        <div class="text-layer" ref="textLayer" @mouseup="handleTextSelection"></div>
      </div>

      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>PDF 로딩 중...</p>
      </div>
    </div>
  </div>
</template>

<script>
import * as pdfjsLib from "pdfjs-dist";

// Add a CSS class to help with text highlighting
const TEXT_LAYER_CLASS = "textLayer";

export default {
  name: "PDFViewer",
  props: {
    pdfUrl: {
      type: String,
      required: true,
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
      pdfDoc: null,
      currentPage: 1,
      totalPages: 0,
      pageRendering: false,
      pageNumPending: null,
      scale: 1.5,
      isLoading: true,
      selectedText: "",
      contextParagraph: "",
      pageDataUrl: null,
      // Add a reference to track the active text layer renderer
      textLayerRenderer: null,
    };
  },
  mounted() {
    console.log("PDFViewer component mounted");
    this.initPdfJs();
    window.addEventListener("resize", this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
    }
  },
  methods: {
    initPdfJs() {
      // Set the worker source path using CDN
      if (typeof pdfjsLib !== "undefined") {
        // Check if worker is already set
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
          console.log("PDF.js worker source set");
        } else {
          console.log("PDF.js worker already configured:", pdfjsLib.GlobalWorkerOptions.workerSrc);
        }
      } else {
        console.error("PDF.js library not loaded properly");
      }

      // Load document
      this.loadDocument();
    },

    async loadDocument() {
      this.isLoading = true;
      console.log("Starting PDF loading process for URL:", this.pdfUrl);

      try {
        // Construct full URL
        const baseUrl = window.location.origin;
        let fullUrl = this.pdfUrl;

        if (!this.pdfUrl.startsWith("http")) {
          // Local PDF file path handling
          const pathParts = this.pdfUrl.split("/");
          console.log("Path parts:", pathParts);

          // Encode only the filename part (last part)
          const encodedFilename = encodeURIComponent(pathParts[pathParts.length - 1]);
          console.log("Encoded filename:", encodedFilename);

          // Reconstruct path with encoded filename
          const pathPrefix = pathParts.slice(0, -1).join("/");
          const encodedPath = pathPrefix ? `${pathPrefix}/${encodedFilename}` : encodedFilename;

          // Ensure path starts with /
          const normalizedPath = encodedPath.startsWith("/") ? encodedPath : `/${encodedPath}`;

          fullUrl = `${baseUrl}${normalizedPath}`;
          console.log("Encoded local PDF path:", this.pdfUrl, "->", fullUrl);

          // Also try to fetch directly to check if file exists
          try {
            const testFetch = await fetch(`${baseUrl}/pdfs/${encodedFilename}`, { method: "HEAD" });
            console.log(`Direct fetch test: ${testFetch.status} ${testFetch.statusText}`);
          } catch (e) {
            console.warn("Direct fetch test failed:", e);
          }
        }

        console.log("Loading PDF from:", fullUrl);

        // First, try a fetch to see if the resource actually exists
        let resourceExists = false;

        try {
          const response = await fetch(fullUrl, { method: "HEAD" });
          resourceExists = response.ok;

          if (!response.ok) {
            console.error(`Received ${response.status} ${response.statusText} for ${fullUrl}`);

            // Try with double encoding which sometimes helps with special characters
            if (!this.pdfUrl.startsWith("http")) {
              const doubleEncodedPath = encodeURI(fullUrl);
              console.log("Trying with double encoding:", doubleEncodedPath);

              const altResponse = await fetch(doubleEncodedPath, { method: "HEAD" });
              resourceExists = altResponse.ok;

              if (altResponse.ok) {
                fullUrl = doubleEncodedPath;
                console.log("Double encoding worked, using:", fullUrl);
              }
            }
          } else {
            console.log("Resource exists at:", fullUrl);
          }
        } catch (fetchError) {
          console.warn("Failed to check resource existence:", fetchError);
        }

        if (!resourceExists && !this.pdfUrl.startsWith("http")) {
          // Try a direct path if resource doesn't exist at the normal location
          const directPath = `/pdfs/${encodeURIComponent(this.pdfUrl.split("/").pop())}`;
          const directUrl = `${baseUrl}${directPath}`;

          console.log("Trying direct path:", directUrl);

          try {
            const directResponse = await fetch(directUrl, { method: "HEAD" });
            if (directResponse.ok) {
              fullUrl = directUrl;
              resourceExists = true;
              console.log("Direct path exists, using:", fullUrl);
            }
          } catch (directError) {
            console.warn("Direct path check failed:", directError);
          }
        }

        try {
          // First try with the provided URL
          console.log("Attempting to load PDF with URL:", fullUrl);
          this.pdfDoc = await this.tryLoadPDF(fullUrl);
          console.log("Successfully loaded PDF from URL:", fullUrl);
        } catch (firstError) {
          console.warn("Failed to load PDF with initial URL:", firstError.message);

          if (!this.pdfUrl.startsWith("http")) {
            // Try different encoding approaches for local files
            const encodingAttempts = [
              encodeURI(fullUrl),
              `${baseUrl}/pdfs/${encodeURIComponent(this.pdfUrl.split("/").pop())}`,
              `${baseUrl}${this.pdfUrl.replace(/ /g, "%20")}`,
              // Add more direct attempts for local PDF
              `${baseUrl}/pdfs/Johann%20Hari%20-%20Stolen%20focus%20(2022).pdf`,
            ];

            console.log("Trying fallback encoding approaches:", encodingAttempts);

            let loaded = false;

            for (const attemptUrl of encodingAttempts) {
              if (loaded) break;

              try {
                console.log("Trying alternate encoding:", attemptUrl);
                this.pdfDoc = await this.tryLoadPDF(attemptUrl);
                console.log("Successfully loaded PDF with alternate encoding:", attemptUrl);
                loaded = true;
              } catch (encodeError) {
                console.warn("Encoding attempt failed:", encodeError.message);
              }
            }

            if (!loaded) {
              // Fall back to sample PDF as last resort
              console.log("All local PDF loading attempts failed, falling back to sample");
              const samplePdfUrl =
                "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";
              this.pdfDoc = await this.tryLoadPDF(samplePdfUrl);
              console.log("Successfully loaded fallback PDF");
            }
          } else {
            // Try Mozilla sample for non-local URLs
            const samplePdfUrl =
              "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";
            console.log("Trying fallback sample PDF from:", samplePdfUrl);
            this.pdfDoc = await this.tryLoadPDF(samplePdfUrl);
            console.log("Successfully loaded fallback PDF");
          }
        }

        console.log("PDF loaded successfully, pages:", this.pdfDoc.numPages);
        this.totalPages = this.pdfDoc.numPages;

        // Ensure loading state is updated
        this.isLoading = false;
        console.log("Loading state set to false");

        // Render the first page
        this.renderPage(this.currentPage);
      } catch (error) {
        console.error("Error loading PDF document:", error);
        console.log("Error details:", error.name, error.message);
        // Ensure loading state is updated even on error
        this.isLoading = false;
        console.log("Loading state set to false due to error");
      }
    },

    async tryLoadPDF(url) {
      // Fetch the PDF with additional options
      const loadingTask = pdfjsLib.getDocument({
        url: url,
        withCredentials: false,
        cMapUrl: "https://unpkg.com/pdfjs-dist@2.6.347/cmaps/",
        cMapPacked: true,
        disableRange: false,
        disableStream: false,
        disableAutoFetch: false,
      });

      // Add progress logging
      loadingTask.onProgress = (progressData) => {
        if (progressData.total && progressData.loaded) {
          const percent = Math.round((progressData.loaded / progressData.total) * 100);
          console.log(`Loading PDF: ${percent}%`);
        }
      };

      // Return the document promise
      return await loadingTask.promise;
    },

    async renderPage(pageNum) {
      this.pageRendering = true;
      console.log(`Rendering page ${pageNum}, pageRendering set to true`);
      this.pageDataUrl = null;

      try {
        // Hide loading overlay
        this.isLoading = false;

        console.log(`Getting page ${pageNum} from PDF`);
        const page = await this.pdfDoc.getPage(pageNum);

        // Create a viewport with exact scale to ensure consistent rendering
        const viewport = page.getViewport({ scale: this.scale });
        console.log(`Viewport dimensions: ${viewport.width} x ${viewport.height}`);

        // Set up canvas for PDF rendering
        const canvas = this.$refs.pdfCanvas;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const canvasContext = canvas.getContext("2d", { alpha: false });

        // Set white background for better visibility
        canvasContext.fillStyle = "white";
        canvasContext.fillRect(0, 0, viewport.width, viewport.height);

        // Clear and prepare the text layer container
        const textLayerDiv = this.$refs.textLayer;
        textLayerDiv.innerHTML = "";
        textLayerDiv.className = TEXT_LAYER_CLASS;

        // Set exact dimensions to match the viewport
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;
        textLayerDiv.style.position = "absolute";
        textLayerDiv.style.left = "0";
        textLayerDiv.style.top = "0";
        textLayerDiv.style.right = "0";
        textLayerDiv.style.bottom = "0";

        // First render the PDF page to the canvas
        const renderContext = {
          canvasContext: canvasContext,
          viewport: viewport,
          enableWebGL: false,
          renderInteractiveForms: false,
        };

        console.log("Starting page render");
        const renderTask = page.render(renderContext);

        // Wait for the page to finish rendering
        await renderTask.promise;
        console.log("Page rendered successfully");

        // Now get the text content for the text layer
        const textContent = await page.getTextContent();
        console.log(`Got text content with ${textContent.items.length} text items`);

        // Recreate the offscreen canvas for image data URL
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = viewport.width;
        offscreenCanvas.height = viewport.height;
        const offscreenCtx = offscreenCanvas.getContext("2d", { alpha: false });
        offscreenCtx.drawImage(canvas, 0, 0);

        try {
          // Generate data URL for the image
          this.pageDataUrl = offscreenCanvas.toDataURL("image/png");
          console.log("Generated data URL from canvas");
        } catch (dataUrlError) {
          console.error("Error generating data URL:", dataUrlError);
        }

        // Now render the text layer
        try {
          // Cancel any existing text layer rendering
          if (this.textLayerRenderer) {
            if (typeof this.textLayerRenderer.cancel === "function") {
              this.textLayerRenderer.cancel();
            }
            this.textLayerRenderer = null;
          }

          console.log("Setting up text layer");

          // Use the most appropriate text layer implementation based on PDF.js version
          if (pdfjsLib.TextLayerBuilder) {
            console.log("Using TextLayerBuilder");

            // Create and configure the text layer builder
            this.textLayerRenderer = new pdfjsLib.TextLayerBuilder({
              textLayerDiv: textLayerDiv,
              pageIndex: page.pageNumber - 1,
              viewport: viewport,
              enhanceTextSelection: true,
            });

            // Set the text content and render
            this.textLayerRenderer.setTextContent(textContent);
            this.textLayerRenderer.render();
          } else if (pdfjsLib.renderTextLayer) {
            console.log("Using renderTextLayer API");

            // Use the newer renderTextLayer API
            const renderTextLayerParams = {
              textContent: textContent,
              container: textLayerDiv,
              viewport: viewport,
              textDivs: [],
              enhanceTextSelection: true,
            };

            this.textLayerRenderer = pdfjsLib.renderTextLayer(renderTextLayerParams);
            await this.textLayerRenderer.promise;
          } else {
            console.warn("PDF.js text layer features not available, using basic implementation");

            // Basic text layer implementation as fallback
            const textItems = textContent.items;

            // Group text items by their vertical position to form 'paragraphs'
            const paragraphs = {};

            textItems.forEach((item) => {
              // Extract the transform matrix
              const transform = item.transform;
              const y = Math.round(transform[5]); // Vertical position

              // Group by vertical position (y-coordinate)
              if (!paragraphs[y]) {
                paragraphs[y] = [];
              }
              paragraphs[y].push(item);
            });

            // Sort paragraphs by vertical position
            const sortedYPositions = Object.keys(paragraphs).sort(
              (a, b) => parseFloat(a) - parseFloat(b)
            );

            // Create spans for each text item, grouped by paragraph
            sortedYPositions.forEach((y) => {
              const paraItems = paragraphs[y].sort((a, b) => a.transform[4] - b.transform[4]);

              // Create a paragraph container
              const paraDiv = document.createElement("div");
              paraDiv.style.position = "absolute";
              paraDiv.style.top = `${y}px`;
              paraDiv.style.left = "0";
              paraDiv.style.width = "100%";
              paraDiv.style.transformOrigin = "0% 0%";

              // Add all text items in this paragraph
              paraItems.forEach((item) => {
                const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);

                const span = document.createElement("span");
                span.textContent = item.str;
                span.style.position = "absolute";
                span.style.left = `${tx[4]}px`;
                span.style.fontSize = `${Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) * 100}%`;
                span.style.fontFamily = item.fontName || "sans-serif";
                span.style.color = "transparent";

                paraDiv.appendChild(span);
              });

              textLayerDiv.appendChild(paraDiv);
            });
          }

          // Make text selectable but keep it visually transparent
          textLayerDiv.style.color = "transparent";
          textLayerDiv.style.pointerEvents = "auto";
          textLayerDiv.classList.add("pdf-text-layer");

          console.log("Text layer setup complete");
        } catch (textLayerError) {
          console.error("Error setting up text layer:", textLayerError);
        }

        // Update rendering state
        this.pageRendering = false;
        console.log(`Finished rendering page ${pageNum}, pageRendering set to false`);

        // Check if there's a pending page render
        if (this.pageNumPending !== null) {
          console.log(`Processing pending page render: ${this.pageNumPending}`);
          this.renderPage(this.pageNumPending);
          this.pageNumPending = null;
        }
      } catch (error) {
        console.error("Error rendering page:", error);
        this.pageRendering = false;
        this.isLoading = false;
        console.log("Rendering error occurred, pageRendering and isLoading set to false");
      }
    },

    renderToImage() {
      try {
        const canvas = this.$refs.pdfCanvas;

        if (!canvas) {
          console.error("Canvas element not found");
          return;
        }

        console.log("Canvas check - Width:", canvas.width, "Height:", canvas.height);

        if (canvas.width <= 0 || canvas.height <= 0) {
          console.warn(
            "Canvas not ready for image conversion - dimensions:",
            canvas.width,
            "x",
            canvas.height
          );
          return;
        }

        // Create a clean copy of the canvas content
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");

        // Use drawImage to copy the original canvas content
        tempCtx.drawImage(canvas, 0, 0);

        try {
          console.log("Converting canvas to image");
          this.pageDataUrl = tempCanvas.toDataURL("image/png");
          console.log("Canvas converted to image successfully");

          // Ensure image is visible
          this.$nextTick(() => {
            const img = this.$refs.pdfImage;
            if (img) {
              img.style.display = "block";
              img.style.visibility = "visible";
              img.onload = () => {
                console.log("Image loaded successfully");
                // Hide canvas after image is loaded to avoid flicker
                if (canvas) {
                  canvas.style.display = "none";
                }
              };
            }
          });
        } catch (dataUrlError) {
          console.error("Error generating data URL:", dataUrlError);
          // Try with JPEG format at lower quality as a fallback
          try {
            this.pageDataUrl = tempCanvas.toDataURL("image/jpeg", 0.8);
            console.log("Canvas converted to JPEG image successfully (fallback)");
          } catch (fallbackError) {
            console.error("Fallback image conversion also failed:", fallbackError);
          }
        }
      } catch (e) {
        console.error("Error converting canvas to image:", e);
      }
    },

    queueRenderPage(num) {
      if (this.pageRendering) {
        this.pageNumPending = num;
      } else {
        this.renderPage(num);
      }
    },

    prevPage() {
      if (this.currentPage <= 1) return;
      this.currentPage--;
      this.queueRenderPage(this.currentPage);
    },

    nextPage() {
      if (this.currentPage >= this.totalPages) return;
      this.currentPage++;
      this.queueRenderPage(this.currentPage);
    },

    handleResize() {
      // Re-render current page when window is resized
      this.renderPage(this.currentPage);
    },

    handleTextSelection() {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        console.log("Text selected:", selectedText);
        this.selectedText = selectedText;

        try {
          // Get the context paragraph
          this.contextParagraph = this.getContextFromSelection(selection);

          // Emit selection event with all the data
          this.$emit("text-selected", {
            text: this.selectedText,
            paragraph: this.contextParagraph,
            page: this.currentPage,
            bookInfo: this.bookInfo,
          });
        } catch (error) {
          console.error("Error processing text selection:", error);
          // Still emit even if there was an error extracting context
          this.$emit("text-selected", {
            text: this.selectedText,
            paragraph: "Error getting context",
            page: this.currentPage,
            bookInfo: this.bookInfo,
          });
        }
      }
    },

    getContextFromSelection(selection) {
      const textLayer = this.$refs.textLayer;

      // Check if selection is within text layer
      let isSelectionInTextLayer = false;
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectionNode = range.commonAncestorContainer;

        // Check if selection is within our text layer
        let parent = selectionNode;
        while (parent && parent !== document.body) {
          if (parent === textLayer) {
            isSelectionInTextLayer = true;
            break;
          }
          parent = parent.parentNode;
        }
      }

      if (!isSelectionInTextLayer) {
        console.log("Selection is outside text layer, ignoring");
        return "No context available";
      }

      let contextParagraph = "";
      const selectedText = selection.toString().trim();

      // Try to get surrounding text at the selection point
      const range = selection.getRangeAt(0);
      const selectionNode = range.commonAncestorContainer;

      // Find paragraph or section containing the selection
      if (selectionNode && selectionNode.textContent) {
        // Check if parent node has more context
        if (
          selectionNode.parentNode &&
          selectionNode.parentNode.textContent &&
          selectionNode.parentNode.textContent.length > selectionNode.textContent.length
        ) {
          contextParagraph = selectionNode.parentNode.textContent.trim();
        } else {
          contextParagraph = selectionNode.textContent.trim();
        }
      }

      // If still no good context, extract from text layer
      if (!contextParagraph || contextParagraph === selectedText) {
        const fullText = textLayer.textContent;
        const selectionIndex = fullText.indexOf(selectedText);

        if (selectionIndex >= 0) {
          const contextStart = Math.max(0, selectionIndex - 100);
          const contextEnd = Math.min(fullText.length, selectionIndex + selectedText.length + 100);

          contextParagraph = fullText.substring(contextStart, contextEnd).trim();
        }
      }

      return contextParagraph || "No context available";
    },
  },
  watch: {
    pdfUrl: {
      handler(newUrl, oldUrl) {
        if (newUrl !== oldUrl) {
          console.log(`PDF URL changed from ${oldUrl} to ${newUrl}, reloading document`);
          this.currentPage = 1;
          this.pageDataUrl = null;
          this.pageRendering = false;
          this.pageNumPending = null;

          // Reset and reload the document
          if (this.pdfDoc) {
            try {
              this.pdfDoc.destroy();
            } catch (e) {
              console.warn("Error destroying previous PDF:", e);
            }
            this.pdfDoc = null;
          }

          this.loadDocument();
        }
      },
      immediate: false,
    },
  },
};
</script>

<style scoped lang="scss">
.pdf-viewer-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.pdf-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  z-index: 5;
}

.page-button {
  padding: 6px 12px;
  margin: 0 10px;
  background-color: #fff2b2;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #ffe980;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f0f0f0;
  }
}

.page-info {
  font-size: 14px;
  color: #333;
}

.pdf-document {
  position: relative;
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background-color: #e0e0e0;
  padding: 20px;
  min-height: 500px; /* Ensure minimum height for visibility */
}

.page-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
  margin: 0 auto;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.pdf-image {
  max-width: 100%;
  height: auto !important;
  background: white;
  z-index: 2;
  display: block !important;
  visibility: visible !important;
  margin: 0 auto;
}

.hidden {
  display: none !important;
  visibility: hidden !important;
}

canvas {
  display: block !important;
  visibility: visible !important;
  max-width: 100%;
  height: auto;
  background: white;
  z-index: 1;
  margin: 0 auto;
}

.text-layer {
  position: absolute;
  text-align: initial;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  line-height: 1;
  opacity: 1;

  // Make text transparent but highlight visible on selection
  & > div,
  & > span {
    color: transparent;
    position: absolute;
    white-space: pre;
    cursor: text;
    transform-origin: 0% 0%;
  }

  // Highlight all selections within the text layer
  ::selection {
    background-color: rgba(255, 220, 105, 0.8) !important;
    color: transparent;
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  margin-bottom: 10px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff5252;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.debug-button {
  display: none;
}

.debug-mode {
  border: none;
}

.debug-info {
  display: none;
}

.pdf-text-layer {
  position: absolute !important;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 1;
  line-height: 1;
  z-index: 3;
  color: transparent;

  & > span {
    color: transparent;
    position: absolute;
    white-space: pre;
    cursor: text;
    transform-origin: 0% 0%;

    &::selection {
      background-color: rgba(255, 242, 178, 0.5) !important;
      color: transparent;
    }
  }
}

// Override text layer styles from pdf.js, if needed
:deep(.textLayer) {
  // Make text invisible but ensure highlights are clearly visible
  opacity: 1;
  color: transparent;

  & > div,
  & > span {
    position: absolute !important;
    color: transparent !important;
    transform-origin: 0% 0%;

    &::selection {
      background-color: rgba(255, 220, 105, 0.8) !important;
      color: transparent;
    }
  }
}

// Add global selection style for text in PDF viewer
::v-deep(.pdf-document *::selection) {
  background-color: rgba(255, 220, 105, 0.8) !important;
  color: transparent;
}

// Ensure text highlighting works during drag operations
.pdf-text-layer ::selection,
.text-layer ::selection {
  background-color: rgba(255, 220, 105, 0.8) !important;
  color: transparent;
}
</style>
