export interface ProcessStep {
  id: 'upload' | 'pdf-convert' | 'ai-analysis' | 'preview' | 'pptx-gen' | 'done';
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export enum ElementType {
  Text = 'text',
  Shape = 'shape',
  Image = 'image'
}

export interface SlideElement {
  type: ElementType;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
  content?: string; // for text
  color?: string; // hex code
  bgColor?: string; // hex code for shapes
  fontSize?: number; // approx points
  shapeType?: 'rect' | 'ellipse' | 'line';
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
}

export interface SlideData {
  index: number;
  backgroundColor: string;
  elements: SlideElement[];
  originalImageBase64: string; // Used for fallback or reference
}

export interface AppState {
  file: File | null;
  isProcessing: boolean;
  currentStep: ProcessStep['id'];
  progress: number; // 0-100
  totalSlides: number;
  processedSlides: number;
  error: string | null;
  generatedFileName: string | null;
  slidesData: SlideData[];
}