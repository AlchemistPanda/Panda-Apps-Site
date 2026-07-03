'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, BookOpen, Loader2, Sparkles, AlertCircle, ArrowRight, Eye } from 'lucide-react';
import { DonationItem, ItemLink } from './lib/types';
import ItemCard from './components/ItemCard';
import ProgressBar from './components/ProgressBar';

export default function DonationLandingPage() {
  const router = useRouter();
  const [items, setItems] = useState<DonationItem[]>([]);
  const [stats, setStats] = useState<{
    totalNamesCount: number;
    namesPledgedCount: number;
    totalItemsPledged: number;
    itemStats: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, statsRes] = await Promise.all([
          fetch('/api/donation/items'),
          fetch('/api/donation/stats')
        ]);
        
        if (!itemsRes.ok || !statsRes.ok) {
          throw new Error("Failed to load catalog data");
        }

        const itemsData = await itemsRes.json();
        const statsData = await statsRes.json();

        // Only display enabled items
        const enabledItems = itemsData.filter((i: DonationItem) => i.enabled);
        setItems(enabledItems);
        setStats(statsData);
      } catch (err: any) {
        setError(err.message || "An error occurred while loading content.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleQuantityChange = (itemId: string, q: number) => {
    setQuantities(prev => ({ ...prev, [itemId]: q }));
  };

  const totalItemsSelected = Object.values(quantities).reduce((a, b) => a + b, 0);

  const totalUnitsSelected = Object.entries(quantities).reduce((sum, [id, q]) => {
    const item = items.find(i => i.id === id);
    const packSize = item?.packSize || 1;
    return sum + (q * packSize);
  }, 0);

  const handlePledgeSubmit = () => {
    const selectedItems = items
      .filter(item => quantities[item.id] > 0)
      .map(item => ({
        itemId: item.id,
        itemName: item.name,
        quantity: quantities[item.id]
      }));

    if (selectedItems.length === 0) {
      alert("Please select at least one item and quantity to donate.");
      return;
    }

    // Save selection to sessionStorage to retrieve in confirmation page
    sessionStorage.setItem('donation_basket', JSON.stringify(selectedItems));
    router.push('/donation/confirm');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcf9f6] gap-3">
        <Loader2 className="w-10 h-10 text-[#e8734a] animate-spin" />
        <p className="text-sm font-semibold text-[#7f8c8d]">Loading Stationery Catalog...</p>
      </div>
    );
  }

  return (
    <div className="don-container relative pb-32">
      {/* Top Banner / Hero */}
      <div className="text-center max-w-2xl mx-auto mt-6 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fbebe4] text-[#e8734a] text-xs font-semibold mb-4 border border-[#e8734a]/10">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Stationery Drive 2026</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#2d3436] tracking-tight mb-4 leading-tight">
          School Stationery <br className="hidden sm:inline" />
          <span className="text-[#e8734a]">Donation Drive</span> 📚
        </h1>
        <p className="text-base text-[#7f8c8d] leading-relaxed mb-6">
          Support students for the upcoming school term. Choose items below from your preferred online shopping platform. Pledge and track your donations to help us complete our requirements!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            onClick={() => router.push('/donation/my-pledge')}
            className="don-btn-outline text-sm py-2 px-5 flex items-center gap-2 border-[#f0e6df] text-[#2d3436]"
          >
            <Eye className="w-4 h-4 text-[#e8734a]" />
            <span>View My Pledge Status</span>
          </button>
        </div>
      </div>

      {/* Progress Bar / Stats Overview */}
      {stats && (
        <div className="max-w-xl mx-auto bg-white border border-[#f0e6df] rounded-3xl p-6 shadow-sm mb-12">
          <ProgressBar 
            current={stats.namesPledgedCount} 
            total={stats.totalNamesCount} 
            label="Overall Donation Progress" 
          />
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#fcf9f6] text-center">
            <div>
              <span className="block text-xs font-semibold text-[#7f8c8d] uppercase tracking-wide">
                Total Items Pledged
              </span>
              <span className="text-2xl font-bold text-[#e8734a] mt-1 block">
                {stats.totalItemsPledged} units
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-[#7f8c8d] uppercase tracking-wide">
                Active Donors
              </span>
              <span className="text-2xl font-bold text-[#e8734a] mt-1 block">
                {stats.namesPledgedCount} people
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-2 border border-red-100 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Informational Callout */}
      <div className="max-w-xl mx-auto bg-amber-50 border border-amber-200/50 rounded-3xl p-5 mb-12 text-xs text-[#2d3436] flex items-start gap-3">
        <span className="text-lg">⚠️</span>
        <div className="leading-relaxed">
          <p className="font-bold text-amber-800">Can I buy from local stores?</p>
          <p className="text-[#7f8c8d] mt-1">
          Yes, you can purchase these products from <strong>any local store or website</strong>! However, please ensure the <strong>brand, model, and color are exactly identical</strong> to the linked products. When distributing items in LP schools, children can feel left out or sad if they receive items that look different from their peers.
          </p>
        </div>
      </div>

      {/* Item Catalog Grid */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#e8734a]" />
            <h2 className="text-2xl font-bold text-[#2d3436]">Stationery Items list</h2>
          </div>
          <span className="text-sm font-semibold text-[#7f8c8d]">
            {items.length} items available
          </span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#f0e6df] rounded-3xl">
            <span className="text-4xl block mb-2">📦</span>
            <p className="font-semibold text-[#2d3436]">No stationery items added yet</p>
            <p className="text-sm text-[#7f8c8d] mt-1">Please check back later or set up items in the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              // Find matching pledged stats for this item
              const itemStat = stats?.itemStats?.find(s => s.itemId === item.id);
              const pledgedSoFar = itemStat ? itemStat.totalPledged : 0;

              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  quantity={quantities[item.id] || 0}
                  onQuantityChange={(q) => handleQuantityChange(item.id, q)}
                  totalPledgedSoFar={pledgedSoFar}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Sticky Bottom Bar */}
      {totalItemsSelected > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-40 px-4">
          <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-md border border-[#e8734a]/20 rounded-full py-4 px-6 shadow-lg flex items-center justify-between gap-4 animate-fade-in-up">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#7f8c8d] uppercase tracking-wide">
                Your Donation Selection
              </span>
              <span className="text-base font-bold text-[#2d3436]">
                {totalItemsSelected} {totalItemsSelected === 1 ? 'pack/item' : 'packs/items'} ({totalUnitsSelected} {totalUnitsSelected === 1 ? 'unit' : 'units'}) selected
              </span>
            </div>
            <button
              onClick={handlePledgeSubmit}
              className="don-btn-primary py-3 px-6 text-sm flex items-center gap-2 shadow-md shadow-[#e8734a]/10"
            >
              <span>I Wish to Donate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
