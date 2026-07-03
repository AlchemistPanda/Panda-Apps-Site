'use client';

import React from 'react';
import { ShoppingBag, Plus, Minus, ExternalLink } from 'lucide-react';
import { DonationItem } from '../lib/types';

interface ItemCardProps {
  item: DonationItem;
  quantity: number;
  onQuantityChange: (q: number) => void;
  totalPledgedSoFar?: number;
}

export default function ItemCard({
  item,
  quantity,
  onQuantityChange,
  totalPledgedSoFar = 0
}: ItemCardProps) {
  const hasQuantity = quantity > 0;

  const progressPercent = item.goalQuantity && item.goalQuantity > 0
    ? Math.min(Math.round((totalPledgedSoFar / item.goalQuantity) * 100), 100)
    : 0;

  const hasLinks = item.links && item.links.length > 0;

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

      {/* E-commerce Store Links */}
      <div className="mt-auto pt-2">
        {hasLinks && (
          <>
            <span className="block text-[11px] font-bold text-[#7f8c8d] mb-2 uppercase tracking-wide">
              {item.links.length > 1 
                ? "Try here to see the products you can buy:" 
                : "From the below link you can buy the product online:"
              }
            </span>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {item.links.map((link) => (
                <a
                  key={link.siteName}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 rounded-xl border border-[#f0e6df] bg-white text-xs font-semibold text-center text-[#2d3436] hover:bg-[#faf6f0] hover:border-[#e8734a]/30 transition-all flex flex-col items-center justify-center gap-1 group/link"
                >
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#e8734a]" />
                    <span className="group-hover/link:underline">{link.siteName}</span>
                  </div>
                  {link.price && (
                    <span className="text-[10px] text-[#7f8c8d]">
                      ₹{link.price}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </>
        )}

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
