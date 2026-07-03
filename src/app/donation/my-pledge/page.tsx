'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Gift, Search, Loader2, RefreshCw, ShoppingCart, ExternalLink, AlertCircle, CheckCircle, Package } from 'lucide-react';
import NameSelector from '../components/NameSelector';
import StatusBadge from '../components/StatusBadge';
import WhatsAppShare, { ExtendedPledge } from '../components/WhatsAppShare';
import { Pledge, DonationItem } from '../lib/types';

export default function MyPledgePage() {
  const router = useRouter();
  const [names, setNames] = useState<string[]>([]);
  const [catalogItems, setCatalogItems] = useState<DonationItem[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [pledge, setPledge] = useState<Pledge | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingPledge, setFetchingPledge] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch Names list and Catalog
  useEffect(() => {
    async function loadData() {
      try {
        const [namesRes, itemsRes] = await Promise.all([
          fetch('/api/donation/names'),
          fetch('/api/donation/items')
        ]);
        if (!namesRes.ok || !itemsRes.ok) throw new Error("Failed to load page parameters");
        const namesData = await namesRes.json();
        const itemsData = await itemsRes.json();
        setNames(namesData);
        setCatalogItems(itemsData);
      } catch (err: any) {
        setError(err.message || "Failed to initialize names selector");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Fetch pledge details when name selected
  useEffect(() => {
    if (!selectedName) {
      setPledge(null);
      return;
    }

    async function loadPledge() {
      setFetchingPledge(true);
      setError('');
      try {
        const res = await fetch(`/api/donation/pledges?donorName=${encodeURIComponent(selectedName)}`);
        if (!res.ok) throw new Error("Failed to load pledge");
        const data = await res.json();
        if (data.length > 0) {
          setPledge(data[0]);
        } else {
          setPledge(null);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch your pledge details.");
      } finally {
        setFetchingPledge(false);
      }
    }

    loadPledge();
  }, [selectedName]);

  // Compute enriched pledge with links from catalog
  const enrichedPledge = useMemo<ExtendedPledge | null>(() => {
    if (!pledge) return null;
    return {
      ...pledge,
      items: pledge.items.map((item) => {
        const catItem = catalogItems.find(c => c.id === item.itemId);
        return {
          ...item,
          links: catItem?.links || []
        };
      })
    };
  }, [pledge, catalogItems]);

  const updateItemStatus = async (itemId: string, status: 'pledged' | 'ordered' | 'delivered') => {
    if (!pledge) return;
    
    setUpdatingItemId(itemId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/donation/pledges/${pledge.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId, status })
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      const data = await res.json();
      setPledge(data.pledge);
      setSuccessMsg(`Status updated to ${status}!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update item status.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleResetAll = async () => {
    if (!pledge) return;
    if (!confirm("Are you sure you want to reset all item statuses back to 'Pledged'?")) return;

    setUpdatingItemId('all');
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/donation/pledges/${pledge.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resetAll: true })
      });

      if (!res.ok) throw new Error("Failed to reset status");
      
      const data = await res.json();
      setPledge(data.pledge);
      setSuccessMsg("All item statuses reset successfully.");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset statuses.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcf9f6] gap-3">
        <Loader2 className="w-10 h-10 text-[#e8734a] animate-spin" />
        <p className="text-sm font-semibold text-[#7f8c8d]">Setting up search page...</p>
      </div>
    );
  }

  return (
    <div className="don-container max-w-2xl mt-6">
      {/* Header back button */}
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
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2d3436]">Track My Pledge</h1>
            <p className="text-xs text-[#7f8c8d] mt-0.5">Select your name to check and update your pledged items</p>
          </div>
        </div>

        {/* Name Selector */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-[#2d3436] mb-2 uppercase tracking-wide">
            Select Your Name
          </label>
          <NameSelector
            names={names}
            selectedName={selectedName}
            onChange={setSelectedName}
            placeholder="Search or select your name..."
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-2 border border-red-100 text-xs font-semibold mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-2 border border-emerald-100 text-xs font-semibold mb-6">
            <CheckCircle className="w-5 h-5 shrink-0 text-[#5e8075]" />
            <span>{successMsg}</span>
          </div>
        )}

        {fetchingPledge ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-[#e8734a] animate-spin" />
            <span className="text-xs text-[#7f8c8d] font-semibold">Fetching pledge details...</span>
          </div>
        ) : selectedName && !enrichedPledge ? (
          /* Empty Pledge State */
          <div className="text-center py-12 border border-dashed border-[#f0e6df] rounded-2xl bg-[#fcf9f6]">
            <Gift className="w-10 h-10 text-[#7f8c8d] mx-auto mb-2 opacity-50" />
            <p className="font-bold text-[#2d3436]">No Active Pledge Found</p>
            <p className="text-xs text-[#7f8c8d] mt-1 max-w-xs mx-auto">
              You haven't pledged any stationery items yet. Head back to the landing page to choose items.
            </p>
            <button
              onClick={() => router.push('/donation')}
              className="don-btn-primary mt-4 py-2.5 px-6 text-xs"
            >
              Pledge a Donation
            </button>
          </div>
        ) : enrichedPledge ? (
          /* Pledge Display */
          <div className="space-y-6">
            <div className="p-4 bg-[#fcf9f6] border border-[#f0e6df] rounded-2xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold text-[#7f8c8d] uppercase tracking-wide">
                  Pledge Registered
                </span>
                <span className="block text-xs text-[#2d3436] font-bold mt-0.5">
                  {new Date(enrichedPledge.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetAll}
                disabled={updatingItemId === 'all'}
                className="don-btn-outline px-3 py-1.5 text-[10px] h-8 flex items-center gap-1 border-red-100 hover:bg-red-50 text-red-600 font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset All Statuses</span>
              </button>
            </div>

            <div className="space-y-4">
              <span className="block text-sm font-bold text-[#2d3436] uppercase tracking-wide">
                Your Pledged Items
              </span>

              {enrichedPledge.items.map((item) => {
                const isUpdating = updatingItemId === item.itemId;
                return (
                  <div
                    key={item.itemId}
                    className="p-4 bg-white border border-[#f0e6df] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#2d3436] text-sm truncate">
                          {item.itemName}
                        </h4>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="mt-1 text-[11px] text-[#7f8c8d] space-y-1.5">
                        <span className="block">Quantity: <strong className="text-[#2d3436]">{item.quantity}</strong></span>
                        
                        {item.links && item.links.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.links.map((link) => (
                              <a
                                key={link.siteName}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 bg-[#faf6f0] border border-[#f0e6df] px-2 py-1 rounded-lg text-[9px] text-[#2d3436] font-bold hover:border-[#e8734a]/30 transition-colors"
                              >
                                <span>Buy on {link.siteName}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Update Controllers */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'pledged' && (
                        <button
                          type="button"
                          onClick={() => updateItemStatus(item.itemId, 'ordered')}
                          disabled={isUpdating}
                          className="don-btn-outline px-3 py-2 text-[10px] h-8 font-bold flex items-center gap-1 bg-blue-50 border-blue-100 hover:bg-blue-100 text-blue-700"
                        >
                          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3" />}
                          <span>I Ordered It</span>
                        </button>
                      )}

                      {item.status === 'ordered' && (
                        <button
                          type="button"
                          onClick={() => updateItemStatus(item.itemId, 'delivered')}
                          disabled={isUpdating}
                          className="don-btn-primary px-3 py-2 text-[10px] h-8 font-bold bg-[#5e8075] hover:bg-[#4e6b61] flex items-center gap-1"
                        >
                          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                          <span>Delivered to Office</span>
                        </button>
                      )}

                      {item.status !== 'pledged' && (
                        <button
                          type="button"
                          onClick={() => updateItemStatus(item.itemId, 'pledged')}
                          disabled={isUpdating}
                          className="don-btn-outline px-2 py-2 text-[10px] h-8 font-bold border-amber-100 hover:bg-amber-50 text-amber-600"
                          title="Reset status back to pledged"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* WhatsApp links share */}
            <div className="border-t border-[#fcf9f6] pt-6 space-y-4">
              <span className="block text-xs font-semibold text-[#7f8c8d] uppercase tracking-wide">
                Options
              </span>
              <WhatsAppShare pledge={enrichedPledge} btnText="Re-share links to my WhatsApp" />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-[#7f8c8d] text-sm">
            Please search and select your name to load pledge details.
          </div>
        )}
      </div>
    </div>
  );
}
