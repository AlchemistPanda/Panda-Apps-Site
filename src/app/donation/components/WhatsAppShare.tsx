'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Pledge, ItemLink } from '../lib/types';

// Extend PledgeItem to allow custom links
export interface ExtendedPledgeItem {
  itemId: string;
  itemName: string;
  quantity: number;
  status: 'pledged' | 'ordered' | 'delivered';
  selectedLink?: ItemLink; // for legacy
  links?: ItemLink[]; // mapped from catalog
}

export interface ExtendedPledge {
  id: string;
  donorName: string;
  items: ExtendedPledgeItem[];
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
}

interface WhatsAppShareProps {
  pledge: ExtendedPledge;
  btnText?: string;
  btnClassName?: string;
}

export default function WhatsAppShare({
  pledge,
  btnText = "Share to My WhatsApp",
  btnClassName = "don-btn-primary w-full"
}: WhatsAppShareProps) {
  
  const generateShareUrl = () => {
    let text = `*Stationery Donation Drive 📚*\n\nHi! Here are the stationery items I pledged to donate:\n\n`;
    
    pledge.items.forEach((item, index) => {
      text += `${index + 1}. *${item.itemName}* (Qty: ${item.quantity})\n`;
      
      if (item.links && item.links.length > 0) {
        item.links.forEach((l) => {
          text += `   🛒 Buy via ${l.siteName}: ${l.url}\n`;
        });
      } else if (item.selectedLink) {
        text += `   🛒 Buy via ${item.selectedLink.siteName}: ${item.selectedLink.url}\n`;
      }
      text += `\n`;
    });
    
    text += `Please save this message or use the links above to complete the order. Once ordered, please mark them as ordered on the website! ❤️`;
    
    const encodedText = encodeURIComponent(text);
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  };

  const handleShare = () => {
    window.open(generateShareUrl(), '_blank');
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={btnClassName}
    >
      <MessageSquare className="w-5 h-5 shrink-0" />
      <span>{btnText}</span>
    </button>
  );
}
