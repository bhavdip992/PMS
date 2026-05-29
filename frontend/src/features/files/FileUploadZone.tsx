import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import api from '../../services/api.tsx';

interface FileUploadZoneProps {
  project: string;
  task?: string;
  subtask?: string;
  attachmentId?: string; // If provided, uploads as a new version
  onUploadComplete: (attachments: any[]) => void;
  allowedTypesText?: string;
}

export default function FileUploadZone({
  project,
  task,
  subtask,
  attachmentId,
  onUploadComplete,
  allowedTypesText = 'Images, Videos, PDFs, ZIP, DOCs up to 100MB'
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setError(null);
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    formData.append('project', project);
    if (task) formData.append('task', task);
    if (subtask) formData.append('subtask', subtask);
    if (attachmentId) formData.append('attachmentId', attachmentId);
    formData.append('permissions', 'public');

    try {
      const res = await api.post('/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.status === 'success') {
        const result = res.data.data.attachments || [];
        onUploadComplete(result);
        setSelectedFiles([]);
      } else {
        setError('Upload completed but response status was unexpected.');
      }
    } catch (err: any) {
      console.error('File upload failed', err);
      setError(err.response?.data?.message || 'File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
          dragActive
            ? 'border-violet-500 bg-violet-950/10 shadow-lg shadow-violet-900/10'
            : 'border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-950/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={!attachmentId} // Multi-file uploading is disabled for version uploads
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-violet-400 transition-colors mb-3">
          <UploadCloud size={20} className={dragActive ? 'animate-bounce text-violet-400' : ''} />
        </div>

        <p className="text-xs font-bold text-slate-205">
          <span className="text-violet-400">Click to upload</span> or drag and drop files here
        </p>
        <p className="text-[10px] text-slate-500 mt-1">{allowedTypesText}</p>
        {attachmentId && (
          <p className="text-[9px] text-amber-400 font-extrabold uppercase mt-2">
            ⚠️ Uploading new version (overwrites current display)
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 bg-rose-950/30 border border-rose-900/50 rounded-xl text-rose-400 text-xs">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Selected Files ({selectedFiles.length})
            </span>
            <button
              onClick={clearSelection}
              disabled={uploading}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-350 disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-900 p-2.5 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <File size={14} className="text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-300 truncate max-w-[200px] sm:max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  disabled={uploading}
                  className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-slate-900"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={uploading}
              className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-550 hover:to-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5"
            >
              {uploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Uploading Files...</span>
                </>
              ) : (
                <span>Upload {selectedFiles.length} file(s)</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
