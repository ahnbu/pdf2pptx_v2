import { GoogleGenAI, Type, MediaResolution } from "@google/genai";
import { SlideData, ElementType } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert presentation layout parser. Your goal is to analyze an image of a presentation slide and extract a structured JSON representation to reconstruct it as an editable PowerPoint file.

**Analysis Strategy:**
1. **Deconstruct Layers**: Identify the background color first. Then, identify shapes that serve as containers or backgrounds. Finally, identify text elements on top.
2. **Visual Asset Preservation (CRITICAL)**: 
   - **Photos, Icons, Logos, Complex Diagrams**: Identify these as \`type: image\`. Do NOT ignore them. We must preserve visual fidelity.
   - **Simple Shapes**: Rectangles, circles, and lines used for design (e.g., text backgrounds, dividers) should be \`type: shape\`.
3. **Text Granularity**: Do *not* group distinct text blocks into a single large box. 
   - A Title and a Subtitle are separate elements.
   - Headers and footers are separate elements.
4. **Shapes vs. Backgrounds**: 
   - If text sits inside a colored box, create a SHAPE element for the box first, then a TEXT element for the content.

**Properties & Estimation Rules:**
- **Coordinates (x, y, w, h)**: Use percentage (0-100) relative to the top-left corner.
  - \`x\`, \`y\`: Position of the top-left corner of the element.
  - \`w\`, \`h\`: Width and height.
  - *Crucial*: Bounding boxes must be tight around the visible content.
- **Font Size**: Estimate in points (pt). 
  - Title: 40-60pt, Subtitle: 24-32pt, Body: 14-20pt, Caption: 10-12pt.
- **Colors**: Return 6-digit Hex codes (e.g., #FF0000).
- **Alignment**: 'left', 'center', 'right'.

**Output Order**:
Return elements in visual stacking order (back to front). Background shapes -> Images -> Text.
`;

export const analyzeSlideWithGemini = async (
  base64Image: string, 
  index: number
): Promise<SlideData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      backgroundColor: { type: Type.STRING, description: "Hex color code for the slide background canvas" },
      elements: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: [ElementType.Text, ElementType.Shape, ElementType.Image] },
            content: { type: Type.STRING, description: "The actual text content. For shapes/images, leave empty." },
            x: { type: Type.NUMBER, description: "Left position (0-100)" },
            y: { type: Type.NUMBER, description: "Top position (0-100)" },
            w: { type: Type.NUMBER, description: "Width (0-100)" },
            h: { type: Type.NUMBER, description: "Height (0-100)" },
            color: { type: Type.STRING, description: "Text color hex code" },
            bgColor: { type: Type.STRING, description: "Shape fill color hex code" },
            fontSize: { type: Type.NUMBER, description: "Estimated font size in points" },
            bold: { type: Type.BOOLEAN, description: "True if text is bold" },
            align: { type: Type.STRING, enum: ["left", "center", "right"] },
            shapeType: { type: Type.STRING, enum: ["rect", "ellipse", "line"], description: "Only for type=shape" }
          },
          required: ["type", "x", "y", "w", "h"]
        }
      }
    },
    required: ["backgroundColor", "elements"]
  };

  try {
    // Using gemini-3-pro-preview for superior vision-to-json spatial reasoning
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Analyze this slide image. Extract layout, text, shapes, and IMAGES into a precise JSON structure. Prioritize preserving diagrams and photos as 'image' type."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.0, // Reduced to 0 for maximum determinism and adherence to spatial facts
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH, // Set to medium for better image quality
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);

    return {
      index,
      originalImageBase64: base64Image,
      backgroundColor: data.backgroundColor || "#FFFFFF",
      elements: data.elements || []
    };

  } catch (error) {
    console.error(`Error analyzing slide ${index}:`, error);
    // Return a fallback with just the image if analysis fails
    return {
      index,
      originalImageBase64: base64Image,
      backgroundColor: "#FFFFFF",
      elements: [
        {
          type: ElementType.Image,
          x: 0, 
          y: 0,
          w: 100,
          h: 100
        }
      ]
    };
  }
};