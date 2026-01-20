import React, { useState } from 'react';
import { FileText, Download, Wand2, RefreshCw, AlertCircle } from 'lucide-react';
import Dropzone from './components/Dropzone';
import ProcessingStatus from './components/ProcessingStatus';
import SlidePreview from './components/SlidePreview';
import { convertPdfToImages } from './services/pdfService';
import { analyzeSlideWithGemini } from './services/geminiService';
import { generatePptxFile } from './services/pptxService';
import { AppState, SlideData } from './types';

const INITIAL_STATE: AppState = {
  file: null,
  isProcessing: false,
  currentStep: 'upload',
  progress: 0,
  totalSlides: 0,
  processedSlides: 0,
  error: null,
  generatedFileName: null,
  slidesData: [],
};

function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const handleFileSelect = (file: File) => {
    setState({ ...INITIAL_STATE, file, currentStep: 'upload' });
  };

  const startConversion = async () => {
    if (!state.file) return;

    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null, currentStep: 'pdf-convert', progress: 5, slidesData: [] }));

      // 1. Convert PDF to Images
      const images = await convertPdfToImages(state.file);
      const totalSlides = images.length;
      
      setState(prev => ({ 
        ...prev, 
        currentStep: 'ai-analysis', 
        totalSlides, 
        progress: 10 
      }));

      // 2. AI Analysis Loop
      const newSlidesData: SlideData[] = [];
      
      for (let i = 0; i < totalSlides; i++) {
        const slideData = await analyzeSlideWithGemini(images[i], i);
        newSlidesData.push(slideData);
        
        const progressPercent = 10 + ((i + 1) / totalSlides) * 80; // 10% to 90%
        setState(prev => ({ 
            ...prev, 
            processedSlides: i + 1, 
            progress: progressPercent 
        }));
      }

      // 3. STOP - Go to Preview Mode instead of generating immediately
      setState(prev => ({ 
          ...prev, 
          slidesData: newSlidesData,
          currentStep: 'preview', 
          isProcessing: false, 
          progress: 90 
      }));

    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: err.message || "An unexpected error occurred.",
        progress: 0
      }));
    }
  };

  const handleUpdateSlides = (updatedSlides: SlideData[]) => {
      setState(prev => ({ ...prev, slidesData: updatedSlides }));
  };

  const handleGeneratePptx = async () => {
      try {
          setState(prev => ({ ...prev, isProcessing: true, currentStep: 'pptx-gen', progress: 95 }));
          await generatePptxFile(state.slidesData);
          
          setState(prev => ({ 
            ...prev, 
            currentStep: 'done', 
            isProcessing: false, 
            progress: 100 
          }));
      } catch (err: any) {
        console.error(err);
        setState(prev => ({ 
            ...prev, 
            isProcessing: false, 
            error: err.message || "Failed to generate PPTX file.",
        }));
      }
  };

  const reset = () => {
    setState(INITIAL_STATE);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
              <Wand2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            PDF to Editable PowerPoint
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Convert your PDF slides back into editable PPTX format. 
            AI separates text and shapes so you can edit the design, not just the background.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8">
          
          {/* Upload Section */}
          {state.currentStep === 'upload' && !state.isProcessing && (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
              <Dropzone onFileSelect={handleFileSelect} />
              
              {state.file && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-50 p-2 rounded-lg">
                      <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{state.file.name}</p>
                      <p className="text-sm text-slate-500">{(state.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={startConversion}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center shadow-md hover:shadow-lg"
                  >
                    Convert to PPTX
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Processing Section */}
          {(state.isProcessing && state.currentStep !== 'pptx-gen') && (
            <div className="animate-fade-in max-w-lg mx-auto">
                <ProcessingStatus 
                    currentStep={state.currentStep}
                    progress={state.progress}
                    totalSlides={state.totalSlides}
                    processedSlides={state.processedSlides}
                />
            </div>
          )}

          {/* Preview Section */}
          {state.currentStep === 'preview' && (
              <div className="animate-fade-in">
                  <SlidePreview 
                    slides={state.slidesData}
                    onUpdateSlides={handleUpdateSlides}
                    onGenerate={handleGeneratePptx}
                    isGenerating={state.isProcessing}
                  />
              </div>
          )}

          {/* Generating Loading State (Specific for PPTX gen to show context) */}
          {state.currentStep === 'pptx-gen' && (
               <div className="animate-fade-in max-w-lg mx-auto text-center p-8">
                   <ProcessingStatus 
                    currentStep={state.currentStep}
                    progress={state.progress}
                    totalSlides={state.totalSlides}
                    processedSlides={state.processedSlides}
                />
               </div>
          )}

          {/* Success Section */}
          {state.currentStep === 'done' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center animate-fade-in max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Conversion Complete!</h2>
              <p className="text-slate-600 mb-8">
                Your file "Converted_Presentation.pptx" has been downloaded.
              </p>
              
              <button
                onClick={reset}
                className="inline-flex items-center justify-center space-x-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Convert another file</span>
              </button>
            </div>
          )}

          {/* Error Section */}
          {state.error && (
             <div className="bg-red-50 rounded-xl border border-red-100 p-6 text-center animate-fade-in max-w-2xl mx-auto">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Conversion Failed</h3>
                <p className="text-red-700 mb-6">{state.error}</p>
                <button
                  onClick={reset}
                  className="bg-white border border-red-200 text-red-700 hover:bg-red-50 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
             </div>
          )}

        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-sm text-slate-400">
           <p>Powered by Gemini 2.0 & PPTXGenJS</p>
        </div>
      </div>
    </div>
  );
}

export default App;