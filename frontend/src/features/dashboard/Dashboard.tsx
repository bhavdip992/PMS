import React, { useState } from 'react';
import api from '../../services/api.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import { Sparkles, Shield } from 'lucide-react';
import DashboardRouter from './DashboardRouter.tsx';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [standup, setStandup] = useState<any>('');
  const [generatingStandup, setGeneratingStandup] = useState(false);
  const [productivityInsights, setProductivityInsights] = useState<any>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const handleGenerateStandup = async () => {
    setGeneratingStandup(true);
    setStandup('');
    try {
      const response = await api.get('/ai/standup');
      setStandup(response.data.data.standup);
    } catch (err) {
      console.error(err);
      setStandup('Failed to generate daily standup summary. Please check your network connection.');
    } finally {
      setGeneratingStandup(false);
    }
  };

  const handleFetchInsights = async () => {
    setGeneratingInsights(true);
    setProductivityInsights(null);
    try {
      const response = await api.post('/ai/productivity-insights', {});
      setProductivityInsights(response.data.data.insights);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch productivity insights.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-violet-950/20 p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/10 text-white font-black text-lg">
            {user?.name?.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">Welcome back, {user?.name}!</h1>
              <span className="bg-violet-950 text-violet-400 border border-violet-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Shield size={10} />
                <span>{user?.role}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Here is a synthesized overview of your organization workspace metrics today.</p>
          </div>
        </div>
        <button
          onClick={handleGenerateStandup}
          disabled={generatingStandup}
          className="mt-4 md:mt-0 flex items-center justify-center space-x-2 px-4.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold rounded-xl shadow-lg shadow-violet-600/15 transition-all text-xs border border-violet-500/20"
        >
          <Sparkles size={13} className={generatingStandup ? 'animate-spin' : ''} />
          <span>{generatingStandup ? 'Synthesizing...' : 'Generate Daily Standup'}</span>
        </button>
      </div>

      {/* Standup Result Panel */}
      {(() => {
        if (!standup) return null;

        let parsedStandup: any = null;
        if (typeof standup === 'object' && standup !== null) {
          parsedStandup = standup;
        } else if (typeof standup === 'string') {
          try {
            parsedStandup = JSON.parse(standup);
          } catch (e) {
            // fall back to string rendering
          }
        }

        return (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden animate-fadeIn space-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full filter blur-2xl" />
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-xs text-violet-400 flex items-center space-x-2 uppercase tracking-wider">
                <Sparkles size={14} className="text-violet-400" />
                <span>AI Generated Daily Standup Report</span>
              </h3>
              <button
                onClick={() => setStandup('')}
                className="text-xs text-slate-500 hover:text-slate-300 font-semibold"
              >
                Clear
              </button>
            </div>

            {parsedStandup ? (
              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                {/* Summary */}
                <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl">
                  <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider block mb-1">Executive Summary</span>
                  <p className="font-medium text-slate-200">{parsedStandup.summary}</p>
                </div>

                {/* Updates grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Completed */}
                  <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl space-y-2">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block border-b border-emerald-900/30 pb-1">Completed Yesterday</span>
                    <ul className="list-disc ml-4 space-y-1 text-slate-300">
                      {parsedStandup.updates?.completed?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      )) || <li>No tasks recorded.</li>}
                    </ul>
                  </div>

                  {/* Today Focus */}
                  <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-2">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block border-b border-indigo-900/30 pb-1">Focus for Today</span>
                    <ul className="list-disc ml-4 space-y-1 text-slate-300">
                      {parsedStandup.updates?.todayFocus?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      )) || <li>No focus items defined.</li>}
                    </ul>
                  </div>

                  {/* Reviewing */}
                  <div className="p-4 bg-violet-950/20 border border-violet-900/30 rounded-xl space-y-2">
                    <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider block border-b border-violet-900/30 pb-1">In Review</span>
                    <ul className="list-disc ml-4 space-y-1 text-slate-300">
                      {parsedStandup.updates?.reviewing?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      )) || <li>No tasks in review.</li>}
                    </ul>
                  </div>
                </div>

                {/* Blockers & Sprint Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Blockers */}
                  <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block mb-1">Blockers & Impediments</span>
                    <p className="text-slate-300">{parsedStandup.blockersSummary}</p>
                  </div>

                  {/* Sprint Status */}
                  <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-xl">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block mb-1">Sprint Impact</span>
                    <p className="text-slate-300">{parsedStandup.sprintStatus}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-mono bg-slate-950/80 p-4 rounded-xl border border-slate-800/85">
                {standup}
              </div>
            )}
          </div>
        );
      })()}

      {/* AI Productivity Insights */}
      {!productivityInsights && !generatingInsights ? (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/20 p-5 rounded-2xl border border-slate-800 flex justify-between items-center shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Workplace Productivity Insights</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Let Gemini AI analyze sprint delays, team workloads, and project bottleneck risks.</p>
            </div>
          </div>
          <button
            onClick={handleFetchInsights}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <Sparkles size={12} className="text-violet-400" />
            <span>Analyze Workspace</span>
          </button>
        </div>
      ) : generatingInsights ? (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider animate-pulse">Gemini AI is analyzing sprint telemetry...</span>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden space-y-5 animate-fadeIn">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-600/5 rounded-full filter blur-3xl" />
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-xs text-indigo-400 flex items-center space-x-2 uppercase tracking-wider">
              <Sparkles size={14} className="text-indigo-400" />
              <span>AI Productivity & Risk Insights</span>
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFetchInsights}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-300 flex items-center space-x-1"
              >
                <Sparkles size={11} />
                <span>Re-analyze</span>
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => setProductivityInsights(null)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Performance Score & Summary */}
            <div className="lg:col-span-4 bg-slate-950/60 border border-slate-850 p-4.5 rounded-xl flex flex-col items-center text-center space-y-3">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">Sprint Health Score</span>
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-500 transition-all duration-1000"
                    strokeDasharray={`${productivityInsights.performanceScore || 0}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-2xl font-black text-slate-100">{productivityInsights.performanceScore || 0}%</div>
              </div>
              <p className="text-xs text-slate-350 leading-relaxed mt-2">{productivityInsights.productivitySummary}</p>
            </div>

            {/* Right: Detailed breakdown tabs */}
            <div className="lg:col-span-8 space-y-4">
              {/* Delayed tasks analysis */}
              <div>
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block mb-2">Delay Analysis</span>
                <div className="space-y-2">
                  {productivityInsights.delayedTaskAnalysis && productivityInsights.delayedTaskAnalysis.length > 0 ? (
                    productivityInsights.delayedTaskAnalysis.map((task: any, idx: number) => (
                      <div key={idx} className="p-3 bg-rose-950/10 border border-rose-900/20 rounded-lg text-xs flex justify-between items-start gap-4">
                        <div>
                          <span className="font-bold text-slate-200 block">{task.title || 'Task'}</span>
                          <span className="text-slate-400 block mt-0.5">{task.reasonForDelay}</span>
                        </div>
                        <span className="text-[9px] bg-rose-950 text-rose-400 border border-rose-900 px-2 py-0.5 rounded font-black uppercase shrink-0">Impact: {task.impact || 'Medium'}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No delayed deliverables identified.</p>
                  )}
                </div>
              </div>

              {/* Risks & Mitigations */}
              <div>
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block mb-2">Imminent Risks</span>
                <div className="space-y-2">
                  {productivityInsights.risks && productivityInsights.risks.length > 0 ? (
                    productivityInsights.risks.map((risk: any, idx: number) => (
                      <div key={idx} className="p-3 bg-amber-950/10 border border-amber-900/20 rounded-lg text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-200">{risk.description}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${risk.severity === 'High' ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-amber-950 text-amber-400 border border-amber-900'}`}>{risk.severity} Severity</span>
                        </div>
                        <span className="text-slate-400 mt-1 block"><strong className="text-[9px] text-amber-500 uppercase tracking-wider mr-1">Mitigation:</strong> {risk.mitigation}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No current timeline risks flagged.</p>
                  )}
                </div>
              </div>

              {/* Workload assessment */}
              <div>
                <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider block mb-2">Workload Balancing</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {productivityInsights.workloadInsights && productivityInsights.workloadInsights.length > 0 ? (
                    productivityInsights.workloadInsights.map((work: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg text-[11px] flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-200 block">{work.userName}</span>
                          <span className="text-slate-500 text-[10px] block mt-0.5">{work.details}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-bold bg-violet-950 text-violet-400 px-1.5 py-0.5 rounded block">{work.trackedHours} hrs</span>
                          <span className={`text-[8px] font-black uppercase mt-1 inline-block ${work.loadAssessment === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>{work.loadAssessment} load</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No workload insights available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render selected dashboard router */}
      <DashboardRouter />
    </div>
  );
}
