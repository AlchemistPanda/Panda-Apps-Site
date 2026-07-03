'use client';

import React from 'react';
import { Gift, PackageCheck, Truck } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pledged' | 'ordered' | 'delivered';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'delivered':
      return (
        <span className="don-badge bg-emerald-50 text-emerald-700 border border-emerald-200">
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Delivered</span>
        </span>
      );
    case 'ordered':
      return (
        <span className="don-badge bg-blue-50 text-blue-700 border border-blue-200">
          <Truck className="w-3.5 h-3.5" />
          <span>Ordered</span>
        </span>
      );
    case 'pledged':
    default:
      return (
        <span className="don-badge bg-amber-50 text-amber-700 border border-amber-200">
          <Gift className="w-3.5 h-3.5" />
          <span>Pledged</span>
        </span>
      );
  }
}
