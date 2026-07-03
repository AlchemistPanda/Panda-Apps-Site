export interface ItemLink {
  siteName: string; // e.g. "Amazon", "Flipkart"
  url: string;
  price?: number; // optional price in INR
}

export interface DonationItem {
  id: string;
  name: string;
  icon: string; // emoji or character
  imageUrl?: string; // optional uploaded image
  links: ItemLink[];
  enabled: boolean;
  goalQuantity?: number; // optional target goal
  category?: string; // optional grouping
  createdAt: string;
}

export interface PledgeItem {
  itemId: string;
  itemName: string;
  quantity: number;
  selectedLink: ItemLink;
  status: 'pledged' | 'ordered' | 'delivered';
}

export interface Pledge {
  id: string;
  donorName: string;
  items: PledgeItem[];
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export const ADMIN_PASSWORD = "panda@9010";
