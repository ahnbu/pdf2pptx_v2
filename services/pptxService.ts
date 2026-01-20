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

// Define the return type for the generation process
export interface GenerationResult {
    pptxBase64: string;
    images: { name: string; data: string }[];
}

export const generatePptxFile = async (slidesData: SlideData[]): Promise<GenerationResult> => {
  const pptx = new PptxGenJS();
  const collectedImages: { name: string; data: string }[] = [];
  
  pptx.layout = "LAYOUT_16x9";
  const PRES_WIDTH = 10.0;
  const PRES_HEIGHT = 5.625;

  for (let i = 0; i < slidesData.length; i++) {
    const slideData = slidesData[i];
    const slide = pptx.addSlide();
    
    slide.background = { color: slideData.backgroundColor.replace('#', '') };

    for (let j = 0; j < slideData.elements.length; j++) {
      const el = slideData.elements[j];
      const x = (el.x / 100) * PRES_WIDTH;
      const y = (el.y / 100) * PRES_HEIGHT;
      const w = (el.w / 100) * PRES_WIDTH;
      const h = (el.h / 100) * PRES_HEIGHT;

      if (el.type === ElementType.Shape) {
        let shapeType = pptx.ShapeType.rect;
        if (el.shapeType === 'ellipse') shapeType = pptx.ShapeType.ellipse;
        if (el.shapeType === 'line') shapeType = pptx.ShapeType.line;

        slide.addShape(shapeType, {
          x, y, w, h,
          fill: { color: el.bgColor ? el.bgColor.replace('#', '') : 'CCCCCC' },
          line: { width: 0 },
        });
      } else if (el.type === ElementType.Text && el.content) {
        const fontSize = el.fontSize || 14;

        slide.addText(el.content, {
          x, y, w, h,
          fontSize: fontSize,
          color: el.color ? el.color.replace('#', '') : '000000',
          align: el.align || 'left',
          bold: el.bold || false,
          fontFace: "Noto Sans KR", 
          wrap: true,
        });
      } else if (el.type === ElementType.Image) {
        if (slideData.originalImageBase64) {
            try {
                let imagePayload = `data:image/jpeg;base64,${slideData.originalImageBase64}`;
                let rawBase64 = slideData.originalImageBase64;
                
                if (el.w < 95 || el.h < 95) {
                   const croppedDataUrl = await cropImageFromSlide(
                       slideData.originalImageBase64,
                       el.x, el.y, el.w, el.h
                   );
                   imagePayload = croppedDataUrl;
                   rawBase64 = croppedDataUrl.split(',')[1];
                }

                const imageName = `slide_${i+1}_el_${j+1}.jpg`;
                collectedImages.push({ name: imageName, data: rawBase64 });

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

  // Get base64 string of the PPTX file
  const pptxBase64 = await pptx.write({ outputType: "base64" }) as string;
  
  return {
    pptxBase64,
    images: collectedImages
  };
};