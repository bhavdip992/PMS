import React from 'react';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  backgroundColorClass?: string;
  textColorClass?: string;
}

export default function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  colorClass = 'text-violet-500',
  backgroundColorClass = 'text-slate-800',
  textColorClass = 'text-slate-100'
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className={backgroundColorClass}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className={`absolute text-xl font-black ${textColorClass}`}>{Math.round(value)}%</div>
    </div>
  );
}
