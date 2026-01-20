import React, { useCallback } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, disabled }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/pdf') {
          onFileSelect(file);
        } else {
          alert('PDF 파일을 업로드해주세요.');
        }
      }
    },
    [onFileSelect, disabled]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 
        ${disabled ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-800' : 'border-indigo-500 bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-400 cursor-pointer'}
      `}
    >
      <input
        type="file"
        accept="application/pdf"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onChange={handleChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full ${disabled ? 'bg-slate-700' : 'bg-indigo-900/50'}`}>
          <UploadCloud className={`w-8 h-8 ${disabled ? 'text-slate-500' : 'text-indigo-400'}`} />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-200">
            클릭하여 업로드하거나 드래그 앤 드롭하세요
          </p>
          <p className="text-sm text-slate-400 mt-1">
            PDF 파일만 가능 (최대 20MB)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;