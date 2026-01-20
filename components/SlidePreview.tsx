import React, { useState, useRef, useEffect } from 'react';
import { SlideData, ElementType } from '../types';
import { 
  Download, 
  Trash2, 
  Type, 
  Square, 
  Image as ImageIcon,
} from 'lucide-react';

interface SlidePreviewProps {
  slides: SlideData[];
  onUpdateSlides: (slides: SlideData[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({ 
  slides, 
  onUpdateSlides, 
  onGenerate,
  isGenerating 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  
  const currentSlide = slides[currentIndex];
  const listRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to the selected element in the list when selectedElementIndex changes
  useEffect(() => {
    if (selectedElementIndex !== null && listRefs.current[selectedElementIndex]) {
        listRefs.current[selectedElementIndex]?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
  }, [selectedElementIndex]);

  // Reset selection when slide changes
  useEffect(() => {
      setSelectedElementIndex(null);
  }, [currentIndex]);

  const handleElementChange = (elementIndex: number, field: string, value: any) => {
    const updatedSlides = [...slides];
    updatedSlides[currentIndex] = {
      ...updatedSlides[currentIndex],
      elements: updatedSlides[currentIndex].elements.map((el, idx) => 
        idx === elementIndex ? { ...el, [field]: value } : el
      )
    };
    onUpdateSlides(updatedSlides);
  };

  const handleDeleteElement = (elementIndex: number) => {
    const updatedSlides = [...slides];
    updatedSlides[currentIndex] = {
      ...updatedSlides[currentIndex],
      elements: updatedSlides[currentIndex].elements.filter((_, idx) => idx !== elementIndex)
    };
    onUpdateSlides(updatedSlides);
    setSelectedElementIndex(null);
  };

  const getElementIcon = (type: ElementType) => {
    switch (type) {
      case ElementType.Text: return <Type className="w-4 h-4" />;
      case ElementType.Shape: return <Square className="w-4 h-4" />;
      case ElementType.Image: return <ImageIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[800px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Preview & Edit Slides</h2>
          <p className="text-sm text-slate-500">Select elements on the image or list to edit</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <span>Generating...</span>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Generate PPTX</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Slide Thumbnails */}
        <div className="w-40 bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 space-y-4">
          {slides.map((slide, idx) => (
            <div 
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`cursor-pointer transition-all duration-200 rounded-lg overflow-hidden border-2 ${
                idx === currentIndex ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="aspect-video bg-white relative">
                <img 
                  src={`data:image/jpeg;base64,${slide.originalImageBase64}`} 
                  alt={`Slide ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 right-0 bg-black/50 text-white text-xs px-2 py-0.5 rounded-tl">
                  {idx + 1}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Original Reference with Interactive Overlays */}
          <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex items-center justify-center">
            <div className="w-full max-w-4xl shadow-xl rounded-lg overflow-hidden bg-white relative">
                <div className="bg-slate-800 text-white text-xs px-3 py-1 flex justify-between items-center">
                    <span>Original Slide - Click elements to select</span>
                    <span>{currentIndex + 1} / {slides.length}</span>
                </div>
                
                {/* Image Container with Relative Positioning */}
                <div className="relative w-full">
                    <img 
                        src={`data:image/jpeg;base64,${currentSlide.originalImageBase64}`} 
                        className="w-full h-auto block select-none"
                        alt="Original Slide" 
                    />
                    
                    {/* Interactive Overlays */}
                    {currentSlide.elements.map((el, idx) => {
                        const isSelected = idx === selectedElementIndex;
                        return (
                            <div
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElementIndex(idx);
                                }}
                                title={`${el.type} - Click to edit`}
                                className={`absolute transition-all duration-200 cursor-pointer group ${
                                    isSelected 
                                    ? 'border-2 border-red-500 bg-red-500/10 z-20' 
                                    : 'border border-dashed border-indigo-400/30 hover:border-indigo-500 hover:bg-indigo-500/10 z-10'
                                }`}
                                style={{
                                    left: `${el.x}%`,
                                    top: `${el.y}%`,
                                    width: `${el.w}%`,
                                    height: `${el.h}%`,
                                }}
                            >
                                {/* Tooltip label on hover/select */}
                                {(isSelected) && (
                                    <div className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                                        {el.type}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
          </div>

          {/* Right: Parsed Elements Editor */}
          <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-30 shadow-sm">
              <h3 className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Elements</span>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                    {currentSlide.elements.length}
                </span>
              </h3>
            </div>
            
            <div className="p-4 space-y-3 pb-20">
              {currentSlide.elements.map((el, idx) => {
                const isSelected = idx === selectedElementIndex;
                return (
                    <div 
                        key={idx} 
                        ref={el => listRefs.current[idx] = el}
                        onClick={() => setSelectedElementIndex(idx)}
                        className={`border rounded-lg p-3 transition-all duration-200 cursor-pointer relative ${
                            isSelected 
                            ? 'border-red-500 bg-red-50 shadow-md ring-1 ring-red-200' 
                            : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50'
                        }`}
                    >
                    <div className="flex justify-between items-start mb-2">
                        <div className={`flex items-center space-x-2 ${isSelected ? 'text-red-600' : 'text-slate-600'}`}>
                        {getElementIcon(el.type)}
                        <span className="text-xs font-bold uppercase tracking-wide">{el.type}</span>
                        </div>
                        <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteElement(idx);
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Delete Element"
                        >
                        <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {el.type === ElementType.Text && (
                        <div className="space-y-2" onClick={e => e.stopPropagation()}>
                        <textarea
                            value={el.content || ''}
                            onChange={(e) => handleElementChange(idx, 'content', e.target.value)}
                            onFocus={() => setSelectedElementIndex(idx)}
                            className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[60px] p-2 bg-white"
                            placeholder="Text content..."
                        />
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-400 block mb-0.5">Size (pt)</label>
                                <input 
                                    type="number" 
                                    value={el.fontSize || 14}
                                    onChange={(e) => handleElementChange(idx, 'fontSize', parseInt(e.target.value))}
                                    className="w-full text-xs border-slate-300 rounded px-2 py-1"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-400 block mb-0.5">Color</label>
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="color" 
                                        value={el.color?.startsWith('#') ? el.color : `#${el.color || '000000'}`}
                                        onChange={(e) => handleElementChange(idx, 'color', e.target.value)}
                                        className="h-6 w-full p-0 border-0 rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                        </div>
                    )}

                    {el.type === ElementType.Shape && (
                        <div className="text-sm text-slate-500" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs w-10">Type:</span>
                            <select 
                                value={el.shapeType || 'rect'}
                                onChange={(e) => handleElementChange(idx, 'shapeType', e.target.value)}
                                onFocus={() => setSelectedElementIndex(idx)}
                                className="text-xs border-slate-300 rounded px-2 py-1 flex-1"
                            >
                                <option value="rect">Rectangle</option>
                                <option value="ellipse">Ellipse</option>
                                <option value="line">Line</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs w-10">Fill:</span>
                            <input 
                                type="color" 
                                value={el.bgColor?.startsWith('#') ? el.bgColor : `#${el.bgColor || 'CCCCCC'}`}
                                onChange={(e) => handleElementChange(idx, 'bgColor', e.target.value)}
                                className="h-6 flex-1 p-0 border-0 rounded cursor-pointer"
                            />
                        </div>
                        </div>
                    )}

                    {el.type === ElementType.Image && (
                        <div className="text-xs text-slate-500 bg-white/50 p-2 rounded border border-slate-200">
                           <div className="flex justify-between mb-1">
                               <span>Position:</span>
                               <span className="font-mono">{Math.round(el.x)}%, {Math.round(el.y)}%</span>
                           </div>
                           <div className="flex justify-between">
                               <span>Size:</span>
                               <span className="font-mono">{Math.round(el.w)}% x {Math.round(el.h)}%</span>
                           </div>
                        </div>
                    )}
                    </div>
                );
              })}
              
              {currentSlide.elements.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                    No editable elements detected. 
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlidePreview;