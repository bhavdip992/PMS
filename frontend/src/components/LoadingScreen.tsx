import React from 'react';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[hsl(var(--espark-bg))] flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-4 border-[hsl(var(--espark-primary)/0.2)] border-t-[hsl(var(--espark-primary))] animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <img src="/logo.png" alt="esparkPM" className="w-8 h-8 object-contain opacity-80" />
      </div>
    </div>
    <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--espark-muted))] animate-pulse">
      Loading esparkPM…
    </p>
  </div>
);

export default LoadingScreen;
