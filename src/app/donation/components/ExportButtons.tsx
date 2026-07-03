'use client';

import React from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { Pledge } from '../lib/types';

interface ExportButtonsProps {
  pledges: Pledge[];
}

export default function ExportButtons({ pledges }: ExportButtonsProps) {
  
  const exportToCSV = () => {
    if (pledges.length === 0) return;

    // Headers
    const headers = [
      "Pledge ID",
      "Donor Name",
      "Item Name",
      "Quantity Pledged",
      "Selected Store",
      "Store Link",
      "Status",
      "Pledged Date",
      "Last Updated"
    ];

    // Rows
    const rows: string[][] = [];
    pledges.forEach((p) => {
      p.items.forEach((item) => {
        rows.push([
          p.id,
          p.donorName,
          item.itemName,
          item.quantity.toString(),
          item.selectedLink?.siteName || "N/A",
          item.selectedLink?.url || "N/A",
          item.status,
          new Date(p.createdAt).toLocaleDateString(),
          new Date(p.updatedAt).toLocaleDateString()
        ]);
      });
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `donation_pledges_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = pledges.flatMap((p) => 
      p.items.map((item) => `
        <tr>
          <td>${p.donorName}</td>
          <td>${item.itemName}</td>
          <td>${item.quantity}</td>
          <td>${item.selectedLink?.siteName || 'N/A'}</td>
          <td><span class="status-badge status-${item.status}">${item.status.toUpperCase()}</span></td>
          <td>${new Date(p.createdAt).toLocaleDateString()}</td>
        </tr>
      `)
    ).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Stationery Donation Drive Pledges</title>
          <style>
            body { font-family: 'Nunito', sans-serif; padding: 20px; color: #2d3436; }
            h1 { text-align: center; color: #e8734a; margin-bottom: 5px; }
            h3 { text-align: center; color: #7f8c8d; font-weight: normal; margin-top: 0; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #f0e6df; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #faf6f0; color: #2d3436; font-weight: 600; }
            tr:nth-child(even) { background-color: #fcf9f6; }
            .status-badge { font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 9999px; }
            .status-pledged { background-color: #fef3c7; color: #d97706; }
            .status-ordered { background-color: #dbeafe; color: #2563eb; }
            .status-delivered { background-color: #d1fae5; color: #059669; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Stationery Donation Drive 📚</h1>
          <h3>Generated on ${new Date().toLocaleDateString()}</h3>
          <table>
            <thead>
              <tr>
                <th>Donor Name</th>
                <th>Item Pledged</th>
                <th>Qty</th>
                <th>Store</th>
                <th>Status</th>
                <th>Date Pledged</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={exportToCSV}
        className="don-btn-outline px-4 py-2.5 text-sm flex items-center gap-2 border-[#f0e6df] text-[#2d3436]"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        <span>Export CSV</span>
      </button>

      <button
        type="button"
        onClick={printPDF}
        className="don-btn-outline px-4 py-2.5 text-sm flex items-center gap-2 border-[#f0e6df] text-[#2d3436]"
      >
        <Printer className="w-4 h-4 text-[#e8734a]" />
        <span>Print PDF</span>
      </button>
    </div>
  );
}
