import React, { useState } from 'react';
import { ShieldAlert, Trash2, Plus, CheckSquare, Square } from 'lucide-react';

interface QAItem {
  _id?: string;
  item: string;
  isCompleted: boolean;
}

interface QAChecklistProps {
  items: QAItem[];
  onToggle: (itemId: string) => void;
  onAdd: (text: string) => void;
  onRemove: (itemId: string) => void;
}

export default function QAChecklist({
  items,
  onToggle,
  onAdd,
  onRemove
}: QAChecklistProps) {
  const [newText, setNewText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAdd(newText.trim());
    setNewText('');
  };

  const completedCount = items.filter(i => i.isCompleted).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-850">
      <div className="flex justify-between items-center border-b border-slate-850/80 pb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert size={14} className="text-amber-400" />
          <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
            QA Checklist
          </h4>
        </div>
        <span className="text-[10px] font-black text-slate-500 bg-slate-950 border border-slate-850/75 px-2 py-0.5 rounded-lg">
          {completedCount}/{items.length} ({progressPercent}%)
        </span>
      </div>

      {/* Progress Bar */}
      {items.length > 0 && (
        <div className="w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden border border-slate-900">
          <div
            className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-[10px] text-slate-500 py-3 italic">No QA verifications configured yet.</p>
        ) : (
          items.map((i, index) => {
            const itemId = i._id || String(index);
            return (
              <div
                key={itemId}
                className="flex justify-between items-center bg-slate-950/30 border border-slate-850/60 hover:bg-slate-950/70 p-3 rounded-xl text-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => onToggle(itemId)}
                  className="flex items-center space-x-3 text-left flex-1"
                >
                  {i.isCompleted ? (
                    <CheckSquare size={16} className="text-amber-400 flex-shrink-0" />
                  ) : (
                    <Square size={16} className="text-slate-650 flex-shrink-0" />
                  )}
                  <span className={`font-medium ${i.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {i.item}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(itemId)}
                  className="text-slate-550 hover:text-red-400 p-1 hover:bg-slate-900 rounded-lg transition-colors ml-2"
                  aria-label="Remove checklist item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2 mt-2">
        <input
          type="text"
          placeholder="Specify a verification step (e.g., test session timeouts)..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 bg-slate-950/60 border border-slate-850 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-amber-500/50 text-slate-200"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center space-x-1 transition-all border border-slate-750"
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
}
