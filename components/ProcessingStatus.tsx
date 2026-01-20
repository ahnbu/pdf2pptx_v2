import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { ProcessStep } from '../types';

interface ProcessingStatusProps {
  currentStep: string;
  progress: number;
  totalSlides: number;
  processedSlides: number;
  processingSlides?: number[];
}

const steps: { id: string; label: string }[] = [
  { id: 'pdf-convert', label: 'PDF 파싱' },
  { id: 'ai-analysis', label: 'AI 레이아웃 분석' },
  { id: 'pptx-gen', label: 'PPTX 생성 중' },
];

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  currentStep,
  progress,
  totalSlides,
  processedSlides,
  processingSlides = [],
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className="w-full max-w-lg mx-auto bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-6">프레젠테이션 변환 중</h3>
      
      <div className="space-y-6">
        {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index || currentStep === 'done';
            
            return (
                <div key={step.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : isActive ? (
                            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        ) : (
                            <Circle className="w-6 h-6 text-slate-300" />
                        )}
                    </div>
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${isActive || isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                            {step.label}
                        </p>
                        {isActive && step.id === 'ai-analysis' && (
                            <div className="mt-1">
                                <p className="text-xs text-slate-400">
                                    슬라이드 {processedSlides} / {totalSlides} 완료
                                </p>
                                {processingSlides.length > 0 && (
                                    <p className="text-xs text-indigo-400 font-medium animate-pulse">
                                        현재 처리 중: {processingSlides.map(s => s + 1).join(', ')}번 슬라이드
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      <div className="mt-8">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center space-x-2">
                <span>전체 진행률</span>
                <span className="text-slate-500 font-mono">({formatTime(seconds)})</span>
            </div>
            <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;