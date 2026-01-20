import React, { useState } from 'react';
import { FileText, Download, WandSparkles, RefreshCw, AlertCircle } from 'lucide-react';
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
  batchSize: 3,
  processingSlides: [],
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

      // 2. AI Analysis Loop with Batch Processing
      const newSlidesData: SlideData[] = [];
      
      for (let i = 0; i < totalSlides; i += state.batchSize) {
        const batchIndices = Array.from(
          { length: Math.min(state.batchSize, totalSlides - i) }, 
          (_, k) => i + k
        );
        
        setState(prev => ({ 
          ...prev, 
          processingSlides: batchIndices 
        }));

        const batchResults = await Promise.all(
          batchIndices.map(idx => analyzeSlideWithGemini(images[idx], idx))
        );
        
        newSlidesData.push(...batchResults);
        
        const lastProcessedIdx = Math.min(i + state.batchSize, totalSlides);
        const progressPercent = 10 + (lastProcessedIdx / totalSlides) * 80;
        
        setState(prev => ({ 
            ...prev, 
            processedSlides: lastProcessedIdx, 
            progress: progressPercent,
            processingSlides: []
        }));
      }

      // Sort results by index to ensure correct order
      newSlidesData.sort((a, b) => (a.index || 0) - (b.index || 0));

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
        error: err.message || "알 수 없는 오류가 발생했습니다.",
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
          
          // Generate PPTX and collect images
          const result = await generatePptxFile(state.slidesData);
          
          // Prepare folder name: result_mmdd_hhmm
          const now = new Date();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          const hh = String(now.getHours()).padStart(2, '0');
          const min = String(now.getMinutes()).padStart(2, '0');
          const folderName = `result_${mm}${dd}_${hh}${min}`;

          // Send to local save server (Only in local environment)
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
              try {
                  const response = await fetch('http://localhost:3005/api/save', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          folderName,
                          originalFileName: state.file?.name,
                          pptxBase64: result.pptxBase64,
                          analysisJson: state.slidesData,
                          images: result.images
                      }),
                  });
                  const saveResult = await response.json();
                  if (!saveResult.success) console.warn("서버 저장 실패:", saveResult.error);
              } catch (e) {
                  console.warn("로컬 저장 서버에 연결할 수 없습니다. 브라우저 다운로드만 수행합니다.");
              }
          }
          
          // Browser Download
          const downloadName = state.file ? `${state.file.name.replace(/\.[^/.]+$/, "")}_변환.pptx` : `${folderName}.pptx`;
          const byteCharacters = atob(result.pptxBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = downloadName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setState(prev => ({ 
            ...prev, 
            currentStep: 'done', 
            isProcessing: false, 
            progress: 100,
            generatedFileName: `${downloadName} (다운로드 완료)`
          }));
      } catch (err: any) {
        console.error(err);
        setState(prev => ({ 
            ...prev, 
            isProcessing: false, 
            error: err.message || "PPTX 파일 생성 또는 저장 실패 (저장 서버 실행 여부를 확인하세요)",
        }));
      }
  };

  const reset = () => {
    setState(INITIAL_STATE);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-900/50">
              <WandSparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            PDF를 편집 가능한 PPTX로 변환
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            PDF 슬라이드를 편집 가능한 PPTX 형식으로 복원합니다.<br/>
            AI가 텍스트와 도형을 분리하여 디자인 요소까지 편집할 수 있습니다.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8">
          
          {/* Upload Section */}
          {state.currentStep === 'upload' && !state.isProcessing && (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
              <Dropzone onFileSelect={handleFileSelect} />
              
              {state.file && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-50 p-2 rounded-lg">
                      <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{state.file.name}</p>
                      <p className="text-sm text-slate-400">{(state.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="text-slate-400">동시 처리 설정:</span>
                      <div className="flex bg-slate-700/50 p-1 rounded-lg">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setState(prev => ({ ...prev, batchSize: n }))}
                            className={`px-3 py-1 rounded-md transition-all ${
                              state.batchSize === n 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {n}장
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={startConversion}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center shadow-md hover:shadow-lg w-full"
                    >
                      PPTX로 변환하기
                    </button>
                  </div>
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
                    processingSlides={state.processingSlides}
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
                    processingSlides={state.processingSlides}
                />
               </div>
          )}

          {/* Success Section */}
          {state.currentStep === 'done' && (
            <div className="bg-slate-800 rounded-2xl shadow-sm border border-slate-700 p-8 text-center animate-fade-in max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">변환 완료!</h2>
              <p className="text-slate-300 mb-8">
                파일이 성공적으로 변환되었습니다.<br/>
                <span className="text-sm text-slate-500">{state.generatedFileName}</span>
              </p>
              
              <button
                onClick={reset}
                className="inline-flex items-center justify-center space-x-2 text-slate-300 hover:text-indigo-400 font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>다른 파일 변환하기</span>
              </button>
            </div>
          )}

          {/* Error Section */}
          {state.error && (
             <div className="bg-red-900/20 rounded-xl border border-red-800 p-6 text-center animate-fade-in max-w-2xl mx-auto">
                <div className="w-12 h-12 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-300 mb-2">변환 실패</h3>
                <p className="text-red-400 mb-6">{state.error}</p>
                <button
                  onClick={reset}
                  className="bg-slate-800 border border-red-800 text-red-400 hover:bg-red-900/40 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  다시 시도
                </button>
             </div>
          )}

        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-sm text-slate-500">
           <p>Powered by Gemini 3.0 flash & PPTXGenJS</p>
        </div>
      </div>
    </div>
  );
}

export default App;