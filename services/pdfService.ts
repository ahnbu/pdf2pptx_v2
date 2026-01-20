import * as pdfjsLib from 'pdfjs-dist';

// Fix for "Failed to fetch dynamically imported module" error:
// PDF.js v5+ in an ESM environment requires the worker to be loaded as a module (.mjs).
// We use unpkg to point to the exact build artifact 'pdf.worker.min.mjs' corresponding to the library version.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const convertPdfToImages = async (file: File): Promise<string[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Initialize the loading task
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    const images: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Set scale to ensure good quality for AI analysis (approx 1.5x - 2x standard screen)
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error('Could not create canvas context');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Export to JPEG to save size while maintaining quality for AI
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      // Remove data prefix for Gemini API
      images.push(base64.split(',')[1]); 
    }

    return images;
  } catch (error) {
    console.error("PDF Conversion Error:", error);
    // Enhance error message to be more descriptive for the UI
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};