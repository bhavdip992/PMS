import React, { useState, useEffect } from 'react';
import { X, Download, MessageSquare, Send, Calendar, Clock, User, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import api from '../../services/api.tsx';

interface FilePreviewModalProps {
  attachmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onVersionHistoryTrigger?: () => void; // Optional trigger to open version modal
}

export default function FilePreviewModal({
  attachmentId,
  isOpen,
  onClose,
  onVersionHistoryTrigger
}: FilePreviewModalProps) {
  const [attachment, setAttachment] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (isOpen && attachmentId) {
      fetchAttachmentDetails();
    }
  }, [isOpen, attachmentId]);

  const fetchAttachmentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/attachments/${attachmentId}`);
      if (res.data.status === 'success') {
        const data = res.data.data.attachment;
        setAttachment(data);
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load attachment detail', err);
      setError('Could not load attachment. It may have been deleted.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/attachments/${attachmentId}/comments`, {
        content: newComment.trim()
      });
      if (res.data.status === 'success') {
        setComments(res.data.data.attachment.comments || []);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to add file comment', err);
      alert('Could not submit comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
        
        {/* LEFT COLUMN: FILE PREVIEW PANEL */}
        <div className="flex-1 bg-slate-950/50 flex flex-col items-center justify-center p-6 relative border-b md:border-b-0 md:border-r border-slate-850">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Buffering File...</span>
            </div>
          ) : error ? (
            <div className="text-center space-y-3 p-4">
              <FileText size={40} className="text-rose-500 mx-auto opacity-75" />
              <p className="text-xs text-slate-400 font-medium">{error}</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {/* Image Preview */}
              {attachment.fileType === 'image' && (
                <img
                  src={attachment.fileUrl}
                  alt={attachment.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-slate-800/60"
                />
              )}

              {/* Video Preview */}
              {attachment.fileType === 'video' && (
                <video
                  src={attachment.fileUrl}
                  controls
                  className="max-w-full max-h-[60vh] rounded-xl shadow-lg border border-slate-800"
                />
              )}

              {/* PDF Preview */}
              {attachment.fileType === 'pdf' && (
                <iframe
                  src={attachment.fileUrl}
                  title={attachment.name}
                  className="w-full h-full min-h-[50vh] rounded-xl border border-slate-800"
                />
              )}

              {/* Document / Archive fallbacks */}
              {!['image', 'video', 'pdf'].includes(attachment.fileType) && (
                <div className="text-center space-y-4 bg-slate-900 border border-slate-850 p-8 rounded-2xl max-w-sm">
                  <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center mx-auto text-violet-400">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 truncate">{attachment.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                      Format: {attachment.mimeType || attachment.fileType}
                    </p>
                  </div>
                  <a
                    href={attachment.fileUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
                  >
                    <Download size={13} />
                    <span>Download Asset</span>
                  </a>
                </div>
              )}

              {/* Top metadata badge overlay */}
              {attachment && (
                <div className="absolute bottom-2 flex flex-wrap justify-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-800 px-4 py-2 rounded-xl text-[10px]">
                  <span className="text-slate-300 font-bold">Ver: {attachment.version || 1}</span>
                  <span className="text-slate-550">·</span>
                  <span className="text-slate-400">{(attachment.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                  <span className="text-slate-550">·</span>
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-400 hover:underline font-bold"
                  >
                    Open Original &rarr;
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: METADATA & INLINE DISCUSSION LOGS */}
        <div className="w-full md:w-[350px] flex flex-col h-full bg-slate-900">
          {/* Header */}
          <div className="p-4 border-b border-slate-850 flex justify-between items-start">
            <div className="min-w-0">
              <h3 className="text-xs font-black text-slate-100 truncate pr-2">
                {attachment ? attachment.name : 'Asset Detail'}
              </h3>
              {attachment && (
                <p className="text-[9px] text-slate-500 mt-0.5">
                  Uploaded by {attachment.uploadedBy?.name || 'System'}
                </p>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-slate-450 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Details & Actions List */}
          {attachment && (
            <div className="p-4 bg-slate-950/20 border-b border-slate-850 space-y-3.5 text-[10px]">
              <div className="flex justify-between items-center text-slate-400">
                <span className="flex items-center gap-1"><Clock size={11} /> Uploaded</span>
                <span className="font-semibold text-slate-200">{new Date(attachment.createdAt).toLocaleDateString()}</span>
              </div>
              {attachment.checksum && (
                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Checksum MD5</span>
                  <span className="font-mono text-[9px] bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded truncate max-w-[130px]" title={attachment.checksum}>
                    {attachment.checksum}
                  </span>
                </div>
              )}
              
              <div className="flex gap-2 pt-1">
                <a
                  href={attachment.fileUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 hover:text-white font-bold text-center flex items-center justify-center gap-1 transition-all"
                >
                  <Download size={11} />
                  <span>Download</span>
                </a>

                {onVersionHistoryTrigger && (
                  <button
                    onClick={onVersionHistoryTrigger}
                    className="flex-1 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-violet-400 hover:text-violet-300 font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <span>Versions</span>
                    <ChevronRight size={11} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Inline Comments Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-850/50 pb-1.5">
              File Activity Discussion
            </span>

            {comments.length === 0 ? (
              <p className="text-[10px] text-slate-550 italic text-center py-8">
                No inline comments on this file.
              </p>
            ) : (
              comments.map((c, idx) => (
                <div key={idx} className="bg-slate-950/40 border border-slate-855 rounded-xl p-3 space-y-1 text-[10px] leading-relaxed">
                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold">
                    <span className="text-slate-350 font-bold flex items-center gap-1">
                      <User size={10} className="text-slate-400" />
                      {c.author?.name || 'Contributor'}
                    </span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-300 font-medium">{c.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Composer */}
          <form onSubmit={handleAddComment} className="p-3 border-t border-slate-850 bg-slate-950/30 flex gap-2">
            <input
              type="text"
              placeholder="Post inline comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500"
              required
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="p-2 bg-violet-655 hover:bg-violet-600 bg-violet-600 text-white rounded-xl disabled:opacity-50 transition-colors"
              aria-label="Send file comment"
            >
              <Send size={12} fill="white" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
