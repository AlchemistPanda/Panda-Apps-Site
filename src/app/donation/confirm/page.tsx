'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Gift, Loader2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import NameSelector from '../components/NameSelector';

interface BasketItem {
  itemId: string;
  itemName: string;
  quantity: number;
  selectedLink: {
    siteName: string;
    url: string;
    price?: number;
  };
}

export default function PledgeConfirmPage() {
  const router = useRouter();
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [existingPledge, setExistingPledge] = useState<any>(null);
  const [error, setError] = useState('');

  // 1. Load basket from sessionStorage
  useEffect(() => {
    const rawBasket = sessionStorage.getItem('donation_basket');
    if (!rawBasket) {
      router.push('/donation');
      return;
    }
    setBasket(JSON.parse(rawBasket));

    // Fetch name list
    async function fetchNames() {
      try {
        const res = await fetch('/api/donation/names');
        if (!res.ok) throw new Error("Failed to load donor names list");
        const data = await res.json();
        setNames(data);
      } catch (err: any) {
        setError(err.message || "Failed to load donor list.");
      } finally {
        setLoading(false);
      }
    }
    fetchNames();
  }, [router]);

  // 2. Check if a pledge already exists when name changes
  useEffect(() => {
    if (!selectedName) {
      setExistingPledge(null);
      return;
    }

    async function checkPledge() {
      setCheckingExisting(true);
      try {
        const res = await fetch(`/api/donation/pledges?donorName=${encodeURIComponent(selectedName)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setExistingPledge(data[0]); // Pledge for this user
          } else {
            setExistingPledge(null);
          }
        }
      } catch (err) {
        console.error("Error checking existing pledge:", err);
      } finally {
        setCheckingExisting(false);
      }
    }

    checkPledge();
  }, [selectedName]);

  const calculateTotalQuantity = () => basket.reduce((sum, item) => sum + item.quantity, 0);

  const calculateTotalPrice = () => {
    return basket.reduce((sum, item) => {
      const price = item.selectedLink.price || 0;
      return sum + (price * item.quantity);
    }, 0);
  };

  const handleConfirmPledge = async () => {
    if (!selectedName) {
      setError("Please search and select your name from the list.");
      return;
    }
    
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/donation/pledges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          donorName: selectedName,
          items: basket
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit pledge");
      }

      const data = await res.json();
      sessionStorage.setItem('donation_last_pledge', JSON.stringify(data.pledge));
      sessionStorage.removeItem('donation_basket'); // Clear basket
      router.push('/donation/thankyou');
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcf9f6] gap-3">
        <Loader2 className="w-10 h-10 text-[#e8734a] animate-spin" />
        <p className="text-sm font-semibold text-[#7f8c8d]">Setting up confirmation page...</p>
      </div>
    );
  }

  const hasPrices = basket.some(item => item.selectedLink.price && item.selectedLink.price > 0);

  return (
    <div className="don-container max-w-2xl mt-6">
      {/* Header Back Button */}
      <button
        onClick={() => router.push('/donation')}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#7f8c8d] hover:text-[#e8734a] transition-colors mb-6 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </button>

      <div className="bg-white border border-[#f0e6df] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#fbebe4] text-[#e8734a] flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2d3436]">Pledge Your Donation</h1>
            <p className="text-xs text-[#7f8c8d] mt-0.5">Step 2 of 3: Identify yourself and confirm details</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Name Selection */}
          <div>
            <label className="block text-sm font-bold text-[#2d3436] mb-2 uppercase tracking-wide">
              Who is pledging this donation?
            </label>
            <NameSelector
              names={names}
              selectedName={selectedName}
              onChange={setSelectedName}
              placeholder="Start typing your name to search..."
            />
            <p className="text-xs text-[#7f8c8d] mt-1.5">
              Select your name from the verified school member list.
            </p>
          </div>

          {/* Checking status spinner */}
          {checkingExisting && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#7f8c8d]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e8734a]" />
              <span>Verifying your pledge history...</span>
            </div>
          )}

          {/* Existing Pledge Warning */}
          {existingPledge && !checkingExisting && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-amber-900">Existing Pledge Found</p>
                <p className="text-amber-800 mt-1 leading-relaxed">
                  You already pledged <span className="font-bold">{existingPledge.totalQuantity} items</span> on {new Date(existingPledge.createdAt).toLocaleDateString()}.
                  Submitting this pledge will <span className="font-bold text-amber-900">overwrite</span> your previous selections.
                </p>
              </div>
            </div>
          )}

          {/* 2. Review Selection */}
          <div>
            <span className="block text-sm font-bold text-[#2d3436] mb-3 uppercase tracking-wide">
              Selected Stationery Items
            </span>
            <div className="border border-[#f0e6df] rounded-2xl overflow-hidden bg-[#fcf9f6]">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#faf6f0] border-b border-[#f0e6df] text-[10px] sm:text-xs text-[#7f8c8d] font-bold">
                    <th className="px-2 py-3 sm:px-4 text-left">Item Description</th>
                    <th className="px-2 py-3 sm:px-4 text-center">Store Option</th>
                    <th className="px-2 py-3 sm:px-4 text-center">Qty</th>
                    {hasPrices && <th className="px-2 py-3 sm:px-4 text-right">Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e6df] text-[#2d3436]">
                  {basket.map((item) => (
                    <tr key={item.itemId}>
                      <td className="px-2 py-3 sm:px-4 sm:py-3.5 font-medium">{item.itemName}</td>
                      <td className="px-2 py-3 sm:px-4 sm:py-3.5 text-center">
                        <span className="don-badge don-badge-primary text-[9px] sm:text-[10px]">
                          {item.selectedLink.siteName}
                        </span>
                      </td>
                      <td className="px-2 py-3 sm:px-4 sm:py-3.5 text-center font-bold">{item.quantity}</td>
                      {hasPrices && (
                        <td className="px-2 py-3 sm:px-4 sm:py-3.5 text-right font-medium">
                          {item.selectedLink.price 
                            ? `₹${item.selectedLink.price * item.quantity}` 
                            : '—'
                          }
                        </td>
                      )}
                    </tr>
                  ))}
                  
                  {/* Summary Rows */}
                  <tr className="bg-[#faf6f0]/50 font-bold border-t border-[#f0e6df]">
                    <td className="px-2 py-3 sm:px-4 text-left">Total Quantities</td>
                    <td className="px-2 py-3 sm:px-4"></td>
                    <td className="px-2 py-3 sm:px-4 text-center text-[#e8734a] text-sm sm:text-base">{calculateTotalQuantity()}</td>
                    {hasPrices && (
                      <td className="px-2 py-3 sm:px-4 text-right text-[#e8734a] text-sm sm:text-base">
                        ₹{calculateTotalPrice()}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-2 border border-red-100 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleConfirmPledge}
            disabled={submitting || checkingExisting}
            className="don-btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-[#e8734a]/10"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Registering Pledge...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Confirm & Submit Pledge</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
