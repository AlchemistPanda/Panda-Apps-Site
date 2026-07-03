'use client';

import React from 'react';
import { ShoppingBag, Plus, Minus, Check } from 'lucide-react';
import { DonationItem, ItemLink } from '../lib/types';

interface ItemCardProps {
  item: DonationItem;
  quantity: number;
  selectedLink: ItemLink | null;
  onQuantityChange: (q: number) => void;
  onLinkSelect: (link: ItemLink) => void;
  totalPledgedSoFar?: number;
}

export default function ItemCard({
  item,
  quantity,
  selectedLink,
  onQuantityChange,
  onLinkSelect,
  totalPledgedSoFar = 0
}: ItemCardProps) {
  const hasQuantity = quantity > 0;
  
  // Set default link if not selected but links are available
  React.useEffect(() => {
    if (!selectedLink && item.links && item.links.length > 0) {
      onLinkSelect(item.links[0]);
    }
  }, [item.links, selectedLink, onLinkSelect]);

  const progressPercent = item.goalQuantity && item.goalQuantity > 0
    ? Math.min(Math.round((totalPledgedSoFar / item.goalQuantity) * 100), 100)
    : 0;

  return (
    <div className={`don-card flex flex-col h-full transition-all duration-300 ${
      hasQuantity ? 'border-[#e8734a] ring-2 ring-[#e8734a]/10 bg-[#fefdfc]' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl select-none shrink-0 p-3 bg-[#faf6f0] rounded-2xl border border-[#f0e6df]">
          {item.icon || "📦"}
        </div>
        <div className="flex-1 min-w-0">
          {item.category && (
            <span className="don-badge don-badge-primary mb-1 text-[10px] uppercase tracking-wider">
              {item.category}
            </span>
          )}
          <h3 className="font-bold text-[#2d3436] text-lg leading-tight truncate">
            {item.name}
          </h3>
          {item.goalQuantity ? (
            <div className="mt-1 text-xs text-[#7f8c8d]">
              Pledged: <span className="font-semibold text-[#2d3436]">{totalPledgedSoFar}</span> / {item.goalQuantity}
            </div>
          ) : null}
        </div>
      </div>

      {/* Item Goal Progress */}
      {item.goalQuantity ? (
        <div className="mb-4">
          <div className="w-full bg-[#f0e6df] h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#e8734a] h-full rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* E-commerce Store Options */}
      <div className="mt-auto pt-2">
        <span className="block text-xs font-semibold text-[#7f8c8d] mb-2 uppercase tracking-wide">
          Choose Store Link
        </span>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {item.links.map((link) => {
            const isSelected = selectedLink?.siteName === link.siteName;
            return (
              <button
                key={link.siteName}
                type="button"
                onClick={() => onLinkSelect(link)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'border-[#e8734a] bg-[#fbebe4] text-[#e8734a]'
                    : 'border-[#f0e6df] bg-white text-[#2d3436] hover:bg-[#faf6f0]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{link.siteName}</span>
                </div>
                {link.price && (
                  <span className={`text-[10px] ${isSelected ? 'text-[#e8734a]' : 'text-[#7f8c8d]'}`}>
                    ₹{link.price}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between gap-4 border-t border-[#f0e6df] pt-4">
          <span className="text-sm font-semibold text-[#2d3436]">
            Pledge Quantity
          </span>
          <div className="don-stepper">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
              disabled={quantity === 0}
              className="don-stepper-btn disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="don-stepper-value text-[#2d3436]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              className="don-stepper-btn"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
