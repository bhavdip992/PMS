import React, { useState, useEffect } from 'react';
import { X, GitBranch, ArrowUpRight, Download, Calendar, User, FileText, CheckCircle2, History } from 'lucide-react';
import api from '../../services/api.tsx';
import FileUploadZone from './FileUploadZone.tsx';

interface FileVersionHistoryProps {
  attachmentId: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onVersionUpdated?: () => void; // Triggered when a new version is uploaded
}

export default function FileVersionHistory({
  attachmentId,
  projectId,
  isOpen,
  onClose,
  onVersionUpdated
}: FileVersionHistoryProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && attachmentId) {
      fetchVersions();
    }
  }, [isOpen, attachmentId]);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/attachments/${attachmentId}/versions`);
      if (res.data.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load version history', err);
      setError('Could not retrieve file version history.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchVersions();
    if (onVersionUpdated) {
      onVersionUpdated();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-850 flex justify-between items-center bg-slate-900/60 backdrop-blur">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-950/60 border border-violet-850 flex items-center justify-center text-violet-400">
              <History size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">Version Control History</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Manage historical snapshots and upload revisions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body scrollarea */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Scanning History Tree...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-rose-400 text-xs">{error}</div>
          ) : (
            <div className="space-y-6">
              
              {/* CURRENT ACTIVE VERSION CARD */}
              <div className="p-4 bg-gradient-to-r from-violet-950/20 to-indigo-950/20 border border-violet-950/40 rounded-2xl space-y-3">
                <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest block">Active Display Version (v{data.current.version})</span>
                
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{data.current.name}</h4>
                    <p className="text-[10px] text-slate-550 mt-1 flex items-center gap-1.5">
                      <User size={10} />
                      <span>{data.current.uploadedBy?.name || 'Uploader'}</span>
                      <span>·</span>
                      <Calendar size={10} />
                      <span>{new Date(data.current.createdAt).toLocaleString()}</span>
                    </p>
                  </div>

                  <a
                    href={data.current.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-900 border border-slate-800 hover:border-violet-500/50 rounded-xl text-slate-400 hover:text-violet-400 transition-colors flex-shrink-0"
                    title="View file"
                  >
                    <ArrowUpRight size={14} />
                  </a>
                </div>

                <div className="flex flex-wrap gap-2 text-[9px] pt-1.5 border-t border-slate-850/40">
                  <span className="text-slate-450 bg-slate-950 border border-slate-900 px-2 py-0.5 rounded font-medium">
                    {(data.current.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  {data.current.checksum && (
                    <span className="text-slate-450 bg-slate-950 border border-slate-900 px-2 py-0.5 rounded font-mono truncate max-w-[200px]" title={data.current.checksum}>
                      MD5: {data.current.checksum}
                    </span>
                  )}
                </div>
              </div>

              {/* UPLOAD REVISION BOX */}
              <div className="border border-slate-850 p-4 rounded-2xl space-y-3.5 bg-slate-950/10">
                <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Upload New File Revision</span>
                <FileUploadZone
                  project={projectId}
                  attachmentId={attachmentId}
                  onUploadComplete={handleUploadSuccess}
                  allowedTypesText="Select replacement file (will replace current display active file)"
                />
              </div>

              {/* PAST VERSIONS ARCHIVE LIST */}
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block border-b border-slate-850/60 pb-1.5">
                  Historical Archive Log
                </span>

                {(!data.versions || data.versions.length === 0) ? (
                  <p className="text-[10px] text-slate-600 italic text-center py-6">
                    No historical snapshots. This file is on Version 1.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {data.versions.map((ver: any, index: number) => (
                      <div
                        key={index}
                        className="p-3.5 bg-slate-950/40 border border-slate-850/80 hover:border-slate-800 rounded-xl flex justify-between items-center text-xs transition-colors"
                      >
                        <div className="min-w-0 pr-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-extrabold bg-slate-900 border border-slate-850 text-slate-400 px-1.5 py-0.2 rounded">
                              v{ver.version}
                            </span>
                            <span className="font-bold text-slate-300 truncate max-w-[250px]">
                              {ver.name}
                            </span>
                          </div>
                          
                          <p className="text-[9px] text-slate-550 mt-1 flex items-center gap-1.5">
                            <User size={9} />
                            <span>{ver.uploadedBy?.name || 'Member'}</span>
                            <span>·</span>
                            <Calendar size={9} />
                            <span>{new Date(ver.createdAt).toLocaleString()}</span>
                            <span>·</span>
                            <span>{(ver.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                          </p>
                        </div>

                        <a
                          href={ver.fileUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                          title="Download this version"
                        >
                          <Download size={12} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
