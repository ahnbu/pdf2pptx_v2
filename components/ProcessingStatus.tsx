import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { ProcessStep } from '../types';

interface ProcessingStatusProps {
  currentStep: string;
  progress: number;
  totalSlides: number;
  processedSlides: number;
}

const steps: { id: string; label: string }[] = [
  { id: 'pdf-convert', label: 'PDF Parsing' },
  { id: 'ai-analysis', label: 'AI Layout Analysis' },
  { id: 'pptx-gen', label: 'Generating PPTX' },
];

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  currentStep,
  progress,
  totalSlides,
  processedSlides,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Converting Presentation</h3>
      
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
                        <p className={`text-sm font-medium ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                            {step.label}
                        </p>
                        {isActive && step.id === 'ai-analysis' && (
                            <p className="text-xs text-slate-500 mt-1">
                                Processing slide {processedSlides} of {totalSlides}...
                            </p>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      <div className="mt-8">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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