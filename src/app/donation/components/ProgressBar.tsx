'use client';

import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#2d3436]">
          {label || "Pledge Progress"}
        </span>
        <span className="text-sm font-bold text-[#e8734a]">
          {current} of {total} joined ({percentage}%)
        </span>
      </div>
      <div className="don-progress-wrapper">
        <div 
          className="don-progress-bar" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
