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
          alert('Please upload a PDF file.');
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
        ${disabled ? 'opacity-50 cursor-not-allowed border-slate-300 bg-slate-50' : 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-500 cursor-pointer'}
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
        <div className={`p-4 rounded-full ${disabled ? 'bg-slate-200' : 'bg-indigo-100'}`}>
          <UploadCloud className={`w-8 h-8 ${disabled ? 'text-slate-400' : 'text-indigo-600'}`} />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-700">
            Click to upload or drag & drop
          </p>
          <p className="text-sm text-slate-500 mt-1">
            PDF files only (max 20MB)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;