import React, { useState } from 'react';
import { Sparkles, Trash2, Plus, CheckCircle2 } from 'lucide-react';

interface AcceptanceCriteriaProps {
  criteria: string[];
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
  onAutofill?: () => void;
  isAutofilling?: boolean;
}

export default function AcceptanceCriteria({
  criteria,
  onAdd,
  onRemove,
  onAutofill,
  isAutofilling
}: AcceptanceCriteriaProps) {
  const [newText, setNewText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAdd(newText.trim());
    setNewText('');
  };

  return (
    <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-850">
      <div className="flex justify-between items-center border-b border-slate-850/80 pb-3">
        <h4 className="font-bold text-xs text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
          <CheckCircle2 size={14} className="text-violet-400" />
          <span>Acceptance Criteria</span>
        </h4>
        {onAutofill && (
          <button
            type="button"
            onClick={onAutofill}
            disabled={isAutofilling}
            className="text-[9px] font-black uppercase tracking-wider bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/40 px-3 py-1.5 rounded-xl text-white transition-all flex items-center space-x-1 shadow-md shadow-violet-950/20"
          >
            <Sparkles size={11} className={isAutofilling ? 'animate-spin' : ''} />
            <span>{isAutofilling ? 'Generating...' : 'AI Spec Autofill'}</span>
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {criteria.length === 0 ? (
          <p className="text-[10px] text-slate-500 py-3 italic">No acceptance criteria defined yet.</p>
        ) : (
          criteria.map((crit, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-slate-950/40 border border-slate-850/60 px-3.5 py-2.5 rounded-xl text-xs text-slate-300 hover:border-slate-800 hover:bg-slate-950/85 transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500/80" />
                <span className="font-medium">{crit}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="text-slate-550 hover:text-red-400 p-1 hover:bg-slate-900 rounded-lg transition-colors"
                aria-label="Remove criteria"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2 mt-2">
        <input
          type="text"
          placeholder="Describe an expected behavior or outcome..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 bg-slate-950/60 border border-slate-850 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-violet-500/80 text-slate-200"
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
