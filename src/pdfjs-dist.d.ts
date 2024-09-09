// Declare the module for the main PDF.js build
declare module "pdfjs-dist" {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export interface PDFPageProxy {
    getViewport(params: { scale: number }): PDFPageViewport;
    render(params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFPageViewport;
    }): { promise: Promise<void> };
  }

  export interface PDFPageViewport {
    width: number;
    height: number;
  }

  export function getDocument(
    src: string | Uint8Array | PDFDocumentLoadingTask
  ): PDFDocumentLoadingTask;
  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }
}

// Declare the module for the PDF worker entry
declare module "pdfjs-dist/legacy/build/pdf.worker.entry" {
  const workerSrc: string;
  export default workerSrc;
}
