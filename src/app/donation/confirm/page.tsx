'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Gift, Loader2, AlertTriangle, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import NameSelector from '../components/NameSelector';
import { DonationItem, getCleanSiteName } from '../lib/types';

interface BasketItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

export default function PledgeConfirmPage() {
  const router = useRouter();
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [catalogItems, setCatalogItems] = useState<DonationItem[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [existingPledge, setExistingPledge] = useState<any>(null);
  const [error, setError] = useState('');

  // 1. Load basket from sessionStorage and fetch databases
  useEffect(() => {
    const rawBasket = sessionStorage.getItem('donation_basket');
    if (!rawBasket) {
      router.push('/donation');
      return;
    }
    setBasket(JSON.parse(rawBasket));

    async function initData() {
      try {
        const [namesRes, itemsRes] = await Promise.all([
          fetch('/api/donation/names'),
          fetch('/api/donation/items')
        ]);
        
        if (!namesRes.ok || !itemsRes.ok) {
          throw new Error("Failed to load school registers and catalog");
        }
        
        const namesData = await namesRes.json();
        const itemsData = await itemsRes.json();
        
        setNames(namesData);
        setCatalogItems(itemsData);
      } catch (err: any) {
        setError(err.message || "Failed to load donor database.");
      } finally {
        setLoading(false);
      }
    }
    initData();
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

  const calculateTotalPacks = () => basket.reduce((sum, item) => sum + item.quantity, 0);

  const calculateTotalUnits = () => {
    return basket.reduce((sum, item) => {
      const catItem = catalogItems.find(c => c.id === item.itemId);
      const packSize = catItem?.packSize || 1;
      return sum + (item.quantity * packSize);
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
            <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-2xl mb-4 text-xs text-[#2d3436] flex items-start gap-2.5">
              <span className="text-sm">⚠️</span>
              <div>
                <p className="font-bold text-amber-800">Important Brand & Color Consistency Policy</p>
                <p className="text-[#7f8c8d] mt-1 leading-relaxed">
                  You can purchase these items from **local stores or other sites**. However, please verify that the **brand, model, and color are exactly identical** to the ones in the links. When we distribute stationery in LP schools, children can feel very left out or sad if they receive items that look different or have different colors.
                </p>
              </div>
            </div>
            <div className="border border-[#f0e6df] rounded-2xl overflow-hidden bg-[#fcf9f6]">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#faf6f0] border-b border-[#f0e6df] text-[10px] sm:text-xs text-[#7f8c8d] font-bold">
                    <th className="px-3 py-3 text-left">Item Description</th>
                    <th className="px-3 py-3 text-center">Store Links</th>
                    <th className="px-3 py-3 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e6df] text-[#2d3436]">
                  {basket.map((item) => {
                    // Look up corresponding item in the catalog to get links
                    const catItem = catalogItems.find((c) => c.id === item.itemId);
                    const itemLinks = catItem?.links || [];

                    return (
                      <tr key={item.itemId}>
                        <td className="px-3 py-3 font-semibold">{item.itemName}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {itemLinks.length > 0 ? (
                              itemLinks.map((link) => (
                                <a
                                  key={link.siteName}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 bg-white border border-[#f0e6df] px-2 py-1 rounded-lg text-[10px] text-[#2d3436] font-bold hover:border-[#e8734a]/30 hover:bg-[#faf6f0] transition-colors"
                                >
                                  <ShoppingBag className="w-3 h-3 text-[#e8734a]" />
                                  <span>{getCleanSiteName(link)}</span>
                                </a>
                              ))
                            ) : (
                              <span className="text-[#7f8c8d] text-[10px]">No links</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-bold">
                          {item.quantity}
                          {catItem?.packSize && catItem.packSize > 1 && (
                            <span className="block text-[10px] text-[#e8734a] font-normal mt-0.5">
                              ({item.quantity * catItem.packSize} units)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Summary Rows */}
                  <tr className="bg-[#faf6f0]/50 font-bold border-t border-[#f0e6df]">
                    <td className="px-3 py-3 text-left">Total Selection</td>
                    <td className="px-3 py-3 text-center text-xs text-[#7f8c8d] font-normal">
                      ({calculateTotalPacks()} packs)
                    </td>
                    <td className="px-3 py-3 text-center text-[#e8734a] text-sm sm:text-base">
                      {calculateTotalUnits()} units
                    </td>
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
