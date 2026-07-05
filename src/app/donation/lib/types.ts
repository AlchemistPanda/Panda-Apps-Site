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
  packSize?: number; // optional pack size, e.g. 5 or 10, default is 1
  category?: string; // optional grouping
  createdAt: string;
  description?: string; // optional description with brand & qty details
}

export interface PledgeItem {
  itemId: string;
  itemName: string;
  quantity: number;
  status: 'pledged' | 'ordered' | 'delivered';
}

export interface Pledge {
  id: string;
  donorName: string;
  items: PledgeItem[];
  totalQuantity: number; // total units (quantity * packSize summed)
  createdAt: string;
  updatedAt: string;
}



// Helper to parse/extract a clean domain name from a URL if siteName is blank or a full URL
export function getCleanSiteName(link: { siteName: string; url: string }): string {
  if (link.siteName && !link.siteName.toLowerCase().startsWith('http') && !link.siteName.includes('.')) {
    return link.siteName;
  }
  try {
    const urlClean = link.url.trim().startsWith('http') ? link.url.trim() : `https://${link.url.trim()}`;
    const urlObj = new URL(urlClean);
    const host = urlObj.hostname.replace('www.', '');
    // Split by dot and capitalize the first part
    const parts = host.split('.');
    const mainDomain = parts[0] || 'Store';
    return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
  } catch {
    return link.siteName || 'Buy Online';
  }
}
