import PptxGenJS from "pptxgenjs";
import { SlideData, ElementType } from "../types";

// Helper to crop a portion of the base64 image
const cropImageFromSlide = async (
    base64Image: string, 
    xPct: number, 
    yPct: number, 
    wPct: number, 
    hPct: number
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Calculate pixel dimensions
            const startX = (xPct / 100) * img.width;
            const startY = (yPct / 100) * img.height;
            const width = (wPct / 100) * img.width;
            const height = (hPct / 100) * img.height;

            // Set canvas size to the target crop size
            // Ensure strict positive dimensions
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            // Draw the slice
            ctx.drawImage(
                img,
                startX, startY, width, height, // Source crop
                0, 0, width, height            // Destination
            );

            // Return as base64 (jpeg for compression)
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = reject;
        img.src = `data:image/jpeg;base64,${base64Image}`;
    });
};

export const generatePptxFile = async (slidesData: SlideData[]): Promise<void> => {
  const pptx = new PptxGenJS();
  
  // Set basic layout (16:9 is standard)
  pptx.layout = "LAYOUT_16x9";
  
  // Define standard 16:9 slide dimensions in inches
  const PRES_WIDTH = 10.0;
  const PRES_HEIGHT = 5.625;

  // Use a for...of loop to handle async image processing sequentially
  for (const slideData of slidesData) {
    const slide = pptx.addSlide();
    
    // Set background
    slide.background = { color: slideData.backgroundColor.replace('#', '') };

    for (const el of slideData.elements) {
      // Convert percentage coordinates to inches (numbers) to satisfy strict type definitions
      const x = (el.x / 100) * PRES_WIDTH;
      const y = (el.y / 100) * PRES_HEIGHT;
      const w = (el.w / 100) * PRES_WIDTH;
      const h = (el.h / 100) * PRES_HEIGHT;

      if (el.type === ElementType.Shape) {
        // Map shape types
        let shapeType = pptx.ShapeType.rect;
        if (el.shapeType === 'ellipse') shapeType = pptx.ShapeType.ellipse;
        if (el.shapeType === 'line') shapeType = pptx.ShapeType.line;

        slide.addShape(shapeType, {
          x, y, w, h,
          fill: { color: el.bgColor ? el.bgColor.replace('#', '') : 'CCCCCC' },
          line: { width: 0 }, // Ensure no border by setting width to 0
        });
      } else if (el.type === ElementType.Text && el.content) {
        // Use estimated font size to maintain original look as much as possible
        const fontSize = el.fontSize || 14;

        slide.addText(el.content, {
          x, y, w, h,
          fontSize: fontSize,
          color: el.color ? el.color.replace('#', '') : '000000',
          align: el.align || 'left',
          bold: el.bold || false,
          fontFace: "Noto Sans KR", 
          wrap: true,
          // Removed line property entirely to avoid default borders
        });
      } else if (el.type === ElementType.Image) {
        // For images identified by AI, we crop them from the original slide
        if (slideData.originalImageBase64) {
            try {
                let imagePayload = `data:image/jpeg;base64,${slideData.originalImageBase64}`;
                
                if (el.w < 95 || el.h < 95) {
                   const croppedBase64 = await cropImageFromSlide(
                       slideData.originalImageBase64,
                       el.x, el.y, el.w, el.h
                   );
                   imagePayload = croppedBase64;
                }

                slide.addImage({
                    data: imagePayload,
                    x, y, w, h
                });
            } catch (e) {
                console.warn("Failed to crop image, skipping", e);
            }
        }
      }
    }
  }

  await pptx.writeFile({ fileName: "Converted_Presentation.pptx" });
};