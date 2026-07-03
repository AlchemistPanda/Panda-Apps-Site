'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Home, ExternalLink, ShoppingCart, MessageSquare, AlertCircle } from 'lucide-react';
import { Pledge } from '../lib/types';
import WhatsAppShare from '../components/WhatsAppShare';

export default function ThankYouPage() {
  const router = useRouter();
  const [pledge, setPledge] = useState<Pledge | null>(null);

  useEffect(() => {
    const rawPledge = sessionStorage.getItem('donation_last_pledge');
    if (!rawPledge) {
      router.push('/donation');
      return;
    }
    setPledge(JSON.parse(rawPledge));
  }, [router]);

  if (!pledge) {
    return null;
  }

  return (
    <div className="don-container max-w-xl mt-8">
      {/* Main Card */}
      <div className="bg-white border border-[#f0e6df] rounded-3xl p-8 text-center shadow-sm relative overflow-hidden">
        {/* Confetti styling lines */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#e8734a] via-[#ffa384] to-[#5e8075]" />
        
        {/* Checkmark icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#5e8075] flex items-center justify-center mx-auto mb-6 border border-emerald-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-black text-[#2d3436] tracking-tight">
          Pledge Confirmed!
        </h1>
        <p className="text-[#7f8c8d] text-sm mt-2 max-w-md mx-auto">
          Thank you so much, <span className="font-bold text-[#2d3436]">{pledge.donorName}</span>. Your pledge for <span className="font-bold text-[#e8734a]">{pledge.totalQuantity} items</span> has been recorded.
        </p>

        {/* Action Prompt */}
        <div className="my-8 p-4 bg-[#fcf9f6] border border-[#f0e6df] rounded-2xl text-left">
          <div className="flex gap-2 items-start text-xs font-semibold text-[#2d3436] mb-3 uppercase tracking-wider text-[#e8734a]">
            <ShoppingCart className="w-4 h-4 shrink-0 text-[#e8734a]" />
            <span>Next Steps: Order your pledged items</span>
          </div>
          <p className="text-xs text-[#7f8c8d] leading-relaxed mb-4">
            Click the store links below to purchase these items online. Make sure to ship them to the school office. You can also view or update the delivery status of your pledge anytime.
          </p>

          <div className="space-y-3">
            {pledge.items.map((item, idx) => (
              <div 
                key={item.itemId || idx}
                className="flex items-center justify-between gap-3 p-3 bg-white border border-[#f0e6df] rounded-xl hover:border-[#e8734a]/30 transition-all text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-[#2d3436] block truncate">
                    {item.itemName}
                  </span>
                  <span className="text-[#7f8c8d] text-[10px]">
                    Quantity: <span className="font-bold text-[#2d3436]">{item.quantity}</span>
                  </span>
                </div>
                {item.selectedLink && (
                  <a
                    href={item.selectedLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="don-btn-secondary px-3 py-2 text-[10px] h-8 font-bold flex items-center gap-1 shrink-0"
                  >
                    <span>{item.selectedLink.siteName}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp & Navigation buttons */}
        <div className="space-y-3">
          <div className="bg-[#edf3f1] p-3 rounded-2xl text-xs text-[#5e8075] border border-[#edf3f1]/10 flex items-start gap-2 text-left mb-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#5e8075] mt-0.5" />
            <span>
              <strong>Tip:</strong> Share the items and store links to your own WhatsApp so you don't lose the shopping links!
            </span>
          </div>

          <WhatsAppShare pledge={pledge} />

          <button
            onClick={() => router.push('/donation')}
            className="don-btn-outline w-full py-3.5 text-sm flex items-center justify-center gap-2 border-[#f0e6df] text-[#2d3436]"
          >
            <Home className="w-4 h-4 text-[#7f8c8d]" />
            <span>Return to Landing Page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
