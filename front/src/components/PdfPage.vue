<template>
  <div ref="container" class="pdf-page-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
export default {
  props: {
    page: {
      type: Object,
      required: true,
    },
    scale: {
      type: Number,
      default: 1.5,
    },
  },
  mounted() {
    this.renderPage();
  },
  methods: {
    async renderPage() {
      if (!this.page) {
        console.error("No page provided to PdfPage component");
        return;
      }

      try {
        const canvas = this.$refs.canvas;
        const context = canvas.getContext("2d");

        // Set the scale to fit the container
        const viewport = this.page.getViewport({ scale: this.scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        console.log("Rendering page at viewport:", viewport.width, "x", viewport.height);

        await this.page.render(renderContext).promise;
        console.log("Page rendered successfully");
      } catch (error) {
        console.error("Error rendering PDF page:", error);
      }
    },
  },
};
</script>

<style scoped>
.pdf-page-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

canvas {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}
</style>
