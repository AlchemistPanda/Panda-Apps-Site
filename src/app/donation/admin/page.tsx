'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ListOrdered, 
  Settings, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ShoppingBag,
  Power,
  RefreshCw,
  LogOut
} from 'lucide-react';
import PasswordGate from '../components/PasswordGate';
import ExportButtons from '../components/ExportButtons';
import StatusBadge from '../components/StatusBadge';
import { DonationItem, Pledge, ItemLink } from '../lib/types';

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pledges' | 'items' | 'names'>('dashboard');
  const [items, setItems] = useState<DonationItem[]>([]);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [namesText, setNamesText] = useState('');
  const [namesCount, setNamesCount] = useState(0);
  const [stats, setStats] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Item form states
  const [editingItem, setEditingItem] = useState<DonationItem | null>(null);
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemIcon, setItemIcon] = useState('📓');
  const [itemCategory, setItemCategory] = useState('Writing');
  const [itemGoal, setItemGoal] = useState<number | ''>('');
  
  // Multiple links state for item form
  const [itemLinks, setItemLinks] = useState<{ siteName: string; url: string; price?: number }[]>([
    { siteName: 'Amazon', url: '', price: undefined },
    { siteName: 'Flipkart', url: '', price: undefined }
  ]);

  // Pledge filters & expansion
  const [expandedPledges, setExpandedPledges] = useState<Record<string, boolean>>({});
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch admin data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'x-admin-password': 'panda@9010' };
      const [itemsRes, pledgesRes, namesRes, statsRes] = await Promise.all([
        fetch('/api/donation/items', { headers }),
        fetch('/api/donation/pledges', { headers }),
        fetch('/api/donation/names', { headers }),
        fetch('/api/donation/stats', { headers })
      ]);

      if (!itemsRes.ok || !pledgesRes.ok || !namesRes.ok || !statsRes.ok) {
        throw new Error("Failed to load administration data");
      }

      const itemsData = await itemsRes.json();
      const pledgesData = await pledgesRes.json();
      const namesData = await namesRes.json();
      const statsData = await statsRes.json();

      setItems(itemsData);
      setPledges(pledgesData);
      setStats(statsData);
      setNamesText(namesData.join('\n'));
      setNamesCount(namesData.length);
    } catch (err: any) {
      setError(err.message || "Failed to sync admin console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('donation_admin_auth');
    window.location.reload();
  };

  // ── Name List Handler ──
  const handleSaveNames = async () => {
    setError('');
    setSuccess('');
    const parsedNames = namesText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    try {
      const res = await fetch('/api/donation/names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'panda@9010'
        },
        body: JSON.stringify({ names: parsedNames })
      });

      if (!res.ok) throw new Error("Failed to update donor list");
      const data = await res.json();
      setNamesCount(data.count);
      setSuccess("Donor names list updated successfully.");
      fetchData(); // Sync stats
    } catch (err: any) {
      setError(err.message || "Failed to update names.");
    }
  };

  // ── Item CRUD Handlers ──
  const handleAddLinkField = () => {
    setItemLinks([...itemLinks, { siteName: '', url: '', price: undefined }]);
  };

  const handleRemoveLinkField = (index: number) => {
    setItemLinks(itemLinks.filter((_, i) => i !== index));
  };

  const handleLinkFieldChange = (index: number, field: string, val: string) => {
    const updated = [...itemLinks];
    if (field === 'price') {
      updated[index] = { ...updated[index], price: val ? Number(val) : undefined };
    } else {
      updated[index] = { ...updated[index], [field]: val };
    }
    setItemLinks(updated);
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemId('');
    setItemName('');
    setItemIcon('📓');
    setItemCategory('Writing');
    setItemGoal('');
    setItemLinks([
      { siteName: 'Amazon', url: '', price: undefined },
      { siteName: 'Flipkart', url: '', price: undefined }
    ]);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!itemName || !itemIcon) {
      setError("Please specify name and select icon.");
      return;
    }

    const filteredLinks = itemLinks.filter(l => l.siteName && l.url);

    const generatedId = editingItem?.id || itemName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const itemPayload: DonationItem = {
      id: generatedId,
      name: itemName,
      icon: itemIcon,
      enabled: editingItem ? editingItem.enabled : true,
      category: itemCategory,
      goalQuantity: itemGoal ? Number(itemGoal) : undefined,
      links: filteredLinks,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString()
    };

    try {
      const url = editingItem ? `/api/donation/items/${editingItem.id}` : '/api/donation/items';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'panda@9010'
        },
        body: JSON.stringify(itemPayload)
      });

      if (!res.ok) throw new Error("Failed to save stationery item");
      
      setSuccess(`Stationery item "${itemName}" saved!`);
      resetItemForm();
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to save item.");
    }
  };

  const handleEditItemClick = (item: DonationItem) => {
    setEditingItem(item);
    setItemId(item.id);
    setItemName(item.name);
    setItemIcon(item.icon);
    setItemCategory(item.category || 'Writing');
    setItemGoal(item.goalQuantity || '');
    setItemLinks(item.links && item.links.length > 0 ? item.links : [
      { siteName: 'Amazon', url: '', price: undefined },
      { siteName: 'Flipkart', url: '', price: undefined }
    ]);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this stationery item?")) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/donation/items/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': 'panda@9010' }
      });
      if (!res.ok) throw new Error("Failed to delete item");
      setSuccess("Item deleted successfully.");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to delete item.");
    }
  };

  const handleToggleItemEnabled = async (item: DonationItem) => {
    setError('');
    setSuccess('');
    const updated = { ...item, enabled: !item.enabled };
    try {
      const res = await fetch(`/api/donation/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'panda@9010'
        },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error("Failed to toggle item state");
      setSuccess(`Item status updated to ${updated.enabled ? 'Enabled' : 'Disabled'}`);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update item enabled status.");
    }
  };

  // ── Pledge Deletion Handler ──
  const handleDeletePledge = async (pledgeId: string) => {
    if (!confirm("Are you sure you want to remove this entire pledge? This action is permanent!")) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/donation/pledges/${pledgeId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': 'panda@9010' }
      });
      if (!res.ok) throw new Error("Failed to delete pledge");
      setSuccess("Pledge deleted successfully.");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to delete pledge.");
    }
  };

  // Toggle expanded rows in pledges list
  const toggleExpandPledge = (id: string) => {
    setExpandedPledges(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredPledges = pledges.filter(p => 
    p.donorName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcf9f6] gap-3">
        <Loader2 className="w-10 h-10 text-[#e8734a] animate-spin" />
        <p className="text-sm font-semibold text-[#7f8c8d]">Syncing Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="don-container relative pb-16">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0e6df] pb-6 mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2d3436] tracking-tight">
            Donation Console 🐼
          </h1>
          <p className="text-xs text-[#7f8c8d] mt-1">
            Overview, donor database, items catalog, and reporting tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="don-btn-outline px-3.5 py-2 text-xs flex items-center gap-1.5"
            title="Refresh statistics and databases"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            className="don-btn-outline px-3.5 py-2 text-xs flex items-center gap-1.5 border-red-100 hover:bg-red-50 text-red-600"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-2 border border-red-100 text-xs font-semibold mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-2 border border-emerald-100 text-xs font-semibold mb-6">
          <Check className="w-5 h-5 shrink-0 text-[#5e8075]" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#fbebe4] text-[#e8734a]'
                : 'bg-white hover:bg-[#faf6f0] border border-[#f0e6df] text-[#2d3436]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('pledges')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === 'pledges'
                ? 'bg-[#fbebe4] text-[#e8734a]'
                : 'bg-white hover:bg-[#faf6f0] border border-[#f0e6df] text-[#2d3436]'
            }`}
          >
            <ListOrdered className="w-5 h-5" />
            <span>Pledges Database</span>
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === 'items'
                ? 'bg-[#fbebe4] text-[#e8734a]'
                : 'bg-white hover:bg-[#faf6f0] border border-[#f0e6df] text-[#2d3436]'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Catalog settings</span>
          </button>

          <button
            onClick={() => setActiveTab('names')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === 'names'
                ? 'bg-[#fbebe4] text-[#e8734a]'
                : 'bg-white hover:bg-[#faf6f0] border border-[#f0e6df] text-[#2d3436]'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Upload names</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="lg:col-span-3">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              {/* Info Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-[#f0e6df] rounded-2xl p-6 shadow-sm">
                  <span className="text-xs font-semibold text-[#7f8c8d] uppercase tracking-wide">
                    Donor Ratio
                  </span>
                  <span className="text-3xl font-black text-[#2d3436] mt-2 block">
                    {stats.namesPledgedCount} / {stats.totalNamesCount}
                  </span>
                  <div className="w-full bg-[#f0e6df] h-1.5 rounded-full overflow-hidden mt-3">
                    <div 
                      className="bg-[#e8734a] h-full rounded-full" 
                      style={{ width: `${stats.percentagePledged}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#7f8c8d] mt-1.5 block font-semibold">
                    {stats.percentagePledged}% of added names pledged
                  </span>
                </div>

                <div className="bg-white border border-[#f0e6df] rounded-2xl p-6 shadow-sm">
                  <span className="text-xs font-semibold text-[#7f8c8d] uppercase tracking-wide">
                    Total Items Pledged
                  </span>
                  <span className="text-3xl font-black text-[#2d3436] mt-2 block">
                    {stats.totalItemsPledged} units
                  </span>
                  <span className="text-[10px] text-[#7f8c8d] mt-4 block font-semibold">
                    Aggregated across all stationery items
                  </span>
                </div>

                <div className="bg-white border border-[#f0e6df] rounded-2xl p-6 shadow-sm">
                  <span className="text-xs font-semibold text-[#7f8c8d] uppercase tracking-wide">
                    Total Donors List
                  </span>
                  <span className="text-3xl font-black text-[#2d3436] mt-2 block">
                    {namesCount} Students
                  </span>
                  <span className="text-[10px] text-[#7f8c8d] mt-4 block font-semibold">
                    Verified names loaded in system
                  </span>
                </div>
              </div>

              {/* Bar Chart breakdown per item */}
              <div className="bg-white border border-[#f0e6df] rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-[#2d3436] mb-6 uppercase text-sm tracking-wide">
                  Item Pledge Breakdown
                </h3>
                
                {stats.itemStats.length === 0 ? (
                  <p className="text-sm text-center text-[#7f8c8d] py-8">No item data to display.</p>
                ) : (
                  <div className="space-y-4">
                    {stats.itemStats.map((item: any) => {
                      const itemGoalVal = item.goalQuantity || 100; // Fallback helper
                      const pledgePercent = Math.min(Math.round((item.totalPledged / itemGoalVal) * 100), 100);
                      const deliveredPercent = item.totalPledged > 0 ? Math.round((item.deliveredCount / item.totalPledged) * 100) : 0;
                      
                      return (
                        <div key={item.itemId} className="space-y-1.5 border-b border-[#fcf9f6] pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-[#2d3436]">
                              <span className="text-base">{item.icon}</span>
                              <span>{item.itemName}</span>
                            </div>
                            <span className="text-[#7f8c8d]">
                              Pledged: <strong className="text-[#2d3436]">{item.totalPledged}</strong>
                              {item.goalQuantity > 0 ? ` / Goal: ${item.goalQuantity}` : ''}
                            </span>
                          </div>
                          
                          {/* Visually stunning multi-progress bar */}
                          <div className="w-full bg-[#f0e6df] h-3 rounded-full overflow-hidden flex relative">
                            {/* Delivered */}
                            <div 
                              className="bg-[#5e8075] h-full" 
                              style={{ width: `${item.totalPledged > 0 ? (item.deliveredCount / itemGoalVal) * 100 : 0}%` }}
                              title={`Delivered: ${item.deliveredCount}`}
                            />
                            {/* Ordered */}
                            <div 
                              className="bg-blue-500 h-full" 
                              style={{ width: `${item.totalPledged > 0 ? (item.orderedCount / itemGoalVal) * 100 : 0}%` }}
                              title={`Ordered: ${item.orderedCount}`}
                            />
                            {/* Remaining Pledged */}
                            <div 
                              className="bg-[#e8734a] h-full" 
                              style={{ 
                                width: `${Math.max(0, (item.totalPledged - item.orderedCount - item.deliveredCount) / itemGoalVal * 100)}%` 
                              }}
                              title={`Pledged: ${item.totalPledged - item.orderedCount - item.deliveredCount}`}
                            />
                          </div>
                          
                          {/* Mini Details info */}
                          <div className="flex flex-wrap gap-3 text-[10px] text-[#7f8c8d] mt-1 font-semibold">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-[#e8734a] rounded-full" />
                              Pledged ({item.totalPledged - item.orderedCount - item.deliveredCount})
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-blue-500 rounded-full" />
                              Ordered ({item.orderedCount})
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-[#5e8075] rounded-full" />
                              Delivered ({item.deliveredCount})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PLEDGES */}
          {activeTab === 'pledges' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#f0e6df] rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="font-bold text-[#2d3436] uppercase text-sm tracking-wide">
                    Donor Pledges Database
                  </h3>
                  
                  <ExportButtons pledges={pledges} />
                </div>

                {/* Filter Search Input */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search by student name..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="don-input w-full"
                  />
                </div>

                {filteredPledges.length === 0 ? (
                  <p className="text-sm text-center text-[#7f8c8d] py-12">No pledges match filters.</p>
                ) : (
                  <div className="border border-[#f0e6df] rounded-2xl overflow-hidden divide-y divide-[#f0e6df]">
                    {filteredPledges.map((p) => {
                      const isExpanded = expandedPledges[p.id] || false;
                      return (
                        <div key={p.id} className="bg-white hover:bg-[#fcf9f6]/20 transition-all">
                          {/* Row Header */}
                          <div 
                            onClick={() => toggleExpandPledge(p.id)}
                            className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none text-sm"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-[#2d3436] block">
                                {p.donorName}
                              </span>
                              <span className="text-[11px] text-[#7f8c8d]">
                                Date: {new Date(p.createdAt).toLocaleDateString()} | {p.items.length} unique items
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-bold text-[#e8734a]">
                                {p.totalQuantity} items
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-[#7f8c8d]" /> : <ChevronDown className="w-4 h-4 text-[#7f8c8d]" />}
                            </div>
                          </div>

                          {/* Expanded Table content */}
                          {isExpanded && (
                            <div className="bg-[#fcf9f6] p-4 border-t border-[#f0e6df] space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-[#2d3436] uppercase tracking-wide">
                                  Pledge Breakdown
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePledge(p.id)}
                                  className="don-btn-outline px-2 py-1.5 text-[10px] h-7 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1 font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove Pledge</span>
                                </button>
                              </div>

                              <div className="border border-[#f0e6df] rounded-xl overflow-hidden bg-white">
                                <table className="w-full text-left text-xs divide-y divide-[#f0e6df]">
                                  <thead className="bg-[#faf6f0] font-bold text-[#7f8c8d]">
                                    <tr>
                                      <th className="p-3">Item</th>
                                      <th className="p-3 text-center">Store Chosen</th>
                                      <th className="p-3 text-center">Qty</th>
                                      <th className="p-3 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#fcf9f6] text-[#2d3436]">
                                    {p.items.map((item, idx) => (
                                      <tr key={item.itemId || idx}>
                                        <td className="p-3 font-semibold">{item.itemName}</td>
                                        <td className="p-3 text-center">
                                          {item.selectedLink ? (
                                            <a 
                                              href={item.selectedLink.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-0.5 text-[#e8734a] hover:underline font-bold"
                                            >
                                              <span>{item.selectedLink.siteName}</span>
                                            </a>
                                          ) : '—'}
                                        </td>
                                        <td className="p-3 text-center font-bold">{item.quantity}</td>
                                        <td className="p-3 text-center">
                                          <StatusBadge status={item.status} />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ITEMS SETTINGS (CRUD) */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              {/* Item Add/Edit form */}
              <div className="bg-white border border-[#f0e6df] rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-[#2d3436] uppercase text-sm tracking-wide mb-6">
                  {editingItem ? `Edit Item: ${editingItem.name}` : "Create New Stationery Item"}
                </h3>

                <form onSubmit={handleSaveItem} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#2d3436] uppercase tracking-wide mb-2">
                        Item Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Spiral Notebook (A4, 200 pages)"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="don-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2d3436] uppercase tracking-wide mb-2">
                        Emoji Icon
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 📓"
                        value={itemIcon}
                        onChange={(e) => setItemIcon(e.target.value)}
                        className="don-input text-center text-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2d3436] uppercase tracking-wide mb-2">
                        Category Grouping
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Books, Writing, Art"
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value)}
                        className="don-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2d3436] uppercase tracking-wide mb-2">
                        Goal Quantity (Optional)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 100"
                        value={itemGoal}
                        onChange={(e) => setItemGoal(e.target.value === '' ? '' : Number(e.target.value))}
                        className="don-input"
                      />
                    </div>
                  </div>

                  {/* Links Manager */}
                  <div className="border border-[#f0e6df] rounded-2xl p-4 bg-[#fcf9f6]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-[#2d3436] uppercase tracking-wide">
                        E-commerce Shopping Links
                      </span>
                      <button
                        type="button"
                        onClick={handleAddLinkField}
                        className="don-btn-outline px-2.5 py-1 text-[10px] h-7 border-[#e8734a]/30 text-[#e8734a] hover:bg-[#fbebe4] flex items-center gap-1 font-bold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Link</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {itemLinks.map((link, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row items-center gap-3">
                          <input
                            type="text"
                            placeholder="Store (e.g. Amazon)"
                            value={link.siteName}
                            onChange={(e) => handleLinkFieldChange(idx, 'siteName', e.target.value)}
                            className="don-input sm:w-1/4 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Shopping URL..."
                            value={link.url}
                            onChange={(e) => handleLinkFieldChange(idx, 'url', e.target.value)}
                            className="don-input flex-1 text-xs"
                          />
                          <input
                            type="number"
                            placeholder="Price (₹)"
                            value={link.price === undefined ? '' : link.price}
                            onChange={(e) => handleLinkFieldChange(idx, 'price', e.target.value)}
                            className="don-input sm:w-20 text-xs"
                          />
                          {itemLinks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLinkField(idx)}
                              className="p-2.5 rounded-xl border border-red-100 hover:bg-red-50 text-red-600 shrink-0"
                              title="Delete Link Option"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" className="don-btn-primary px-6">
                      {editingItem ? "Update Stationery Item" : "Create Stationery Item"}
                    </button>
                    {editingItem && (
                      <button
                        type="button"
                        onClick={resetItemForm}
                        className="don-btn-outline px-6"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Items Catalog List */}
              <div className="bg-white border border-[#f0e6df] rounded-2xl p-6 shadow-sm">
                <span className="block text-sm font-bold text-[#2d3436] mb-6 uppercase tracking-wide">
                  Configured Stationery Catalog ({items.length})
                </span>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 bg-white border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        item.enabled ? 'border-[#f0e6df]' : 'border-dashed border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl select-none shrink-0 p-2 bg-[#faf6f0] rounded-xl">
                          {item.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#2d3436] text-sm">
                              {item.name}
                            </h4>
                            {!item.enabled && (
                              <span className="don-badge don-badge-warning text-[9px]">Disabled</span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#7f8c8d]">
                            Category: <strong>{item.category || 'N/A'}</strong> | Links: <strong>{item.links?.length || 0}</strong> | Goal: <strong>{item.goalQuantity || 'None'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Edit controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleItemEnabled(item)}
                          className={`don-btn-outline p-2.5 text-[10px] h-8 flex items-center gap-1 font-bold ${
                            item.enabled 
                              ? 'border-amber-100 hover:bg-amber-50 text-amber-600'
                              : 'border-emerald-100 hover:bg-emerald-50 text-emerald-600'
                          }`}
                          title={item.enabled ? "Disable this item in landing catalog" : "Enable this item"}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{item.enabled ? "Disable" : "Enable"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditItemClick(item)}
                          className="don-btn-outline p-2.5 text-[10px] h-8 flex items-center gap-1 border-blue-100 hover:bg-blue-50 text-blue-600 font-bold"
                          title="Modify item specifications"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="don-btn-outline p-2.5 text-[10px] h-8 flex items-center gap-1 border-red-100 hover:bg-red-50 text-red-600 font-bold"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NAMES WRITER */}
          {activeTab === 'names' && (
            <div className="bg-white border border-[#f0e6df] rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-[#2d3436] uppercase text-sm tracking-wide">
                  Donor Names Setup
                </h3>
                <p className="text-xs text-[#7f8c8d] mt-1 leading-relaxed">
                  Enter student names who can make pledges. Enter exactly one name per line. Duplicate entries will automatically be cleaned up.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2d3436] uppercase tracking-wide mb-2">
                    Verified Names List ({namesCount} student names loaded)
                  </label>
                  <textarea
                    rows={12}
                    value={namesText}
                    onChange={(e) => setNamesText(e.target.value)}
                    placeholder="Enter names, one per line..."
                    className="don-input font-mono text-sm leading-relaxed"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveNames}
                  className="don-btn-primary px-8"
                >
                  Save Donor Names List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <PasswordGate>
      <AdminDashboardContent />
    </PasswordGate>
  );
}
