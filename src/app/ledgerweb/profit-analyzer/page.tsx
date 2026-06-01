'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, InvestmentPlan } from '../services/db';
import { Payout, recalculatePayouts } from '../utils/payoutGenerator';
import { NewPlanModal } from '../components/NewPlanModal';
import { PlanCalendar } from '../components/PlanCalendar';
import { SyncBanner, SyncStatus } from '../components/SyncBanner';

export default function ProfitAnalyzer() {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<InvestmentPlan | undefined>(undefined);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  useEffect(() => {
    const initialize = async () => {
      const configured = await db.init();
      if (!configured) {
        setSyncStatus('unconfigured');
      }
      await loadPlans();
    };
    initialize();
  }, []);

  const loadPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const loadedPlans = await db.getPlans();
      setPlans(loadedPlans);
      // Stay on dashboard landing page by default
      setSelectedPlanId('');
      if (db.isConfigured()) {
        setSyncStatus('synced');
      }
    } catch (e) {
      console.error('Failed to load plans', e);
      setSyncStatus('error');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleCreatePlan = async (newPlan: InvestmentPlan) => {
    if (db.isConfigured()) setSyncStatus('saving');
    try {
      await db.savePlan(newPlan);
      const updatedPlans = await db.getPlans();
      setPlans(updatedPlans);
      setSelectedPlanId(newPlan.id);
      if (db.isConfigured()) setSyncStatus('synced');
    } catch (e) {
      console.error('Failed to save plan', e);
      setSyncStatus('error');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm('Are you sure you want to delete this investment plan? All tracking data will be lost.')) {
      if (db.isConfigured()) setSyncStatus('saving');
      try {
        await db.deletePlan(id);
        const updatedPlans = await db.getPlans();
        setPlans(updatedPlans);
        setSelectedPlanId('');
        if (db.isConfigured()) setSyncStatus('synced');
      } catch (e) {
        console.error('Failed to delete plan', e);
        setSyncStatus('error');
      }
    }
  };

  const handleUpdatePlan = async (updatedPlan: InvestmentPlan) => {
    if (db.isConfigured()) setSyncStatus('saving');
    
    // Optimistic UI update
    const previousPlans = [...plans];
    setPlans(prevPlans => prevPlans.map(p => p.id === selectedPlanId ? updatedPlan : p));

    try {
      await db.savePlan(updatedPlan);
      if (db.isConfigured()) setSyncStatus('synced');
    } catch (e) {
      console.error('Failed to update plan details', e);
      setSyncStatus('error');
      // Rollback optimistic update
      setPlans(previousPlans);
    }
  };

  const handleRetrySync = () => {
    if (db.isConfigured()) {
      setSyncStatus('synced');
    } else {
      setSyncStatus('unconfigured');
    }
    loadPlans();
  };

  const handleAutoCreditPastDue = () => {
    if (!activePlan) return;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if there are actually any past due uncredited payouts
    const hasPastDue = activePlan.payouts.some(
      (p) => !p.isHoliday && p.status === 'uncredited' && p.date < todayStr
    );
    if (!hasPastDue) {
      alert("No past due payouts to credit!");
      return;
    }

    if (!confirm("Are you sure you want to mark all past due payouts as credited on their scheduled date?")) {
      return;
    }

    const updatedPayouts = activePlan.payouts.map((p) => {
      if (!p.isHoliday && p.status === 'uncredited' && p.date < todayStr) {
        return {
          ...p,
          status: 'credited' as const,
          creditedDate: p.date,
          receivedAmount: p.amount,
        };
      }
      return p;
    });

    const updatedPlan = {
      ...activePlan,
      payouts: updatedPayouts,
    };

    handleUpdatePlan(recalculatePayouts(updatedPlan));
  };

  const handleCopyAllPlansSummary = () => {
    if (plans.length === 0) {
      alert("No investment plans to copy!");
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let grandInvested = 0;
    let grandExpected = 0;
    let grandCredited = 0;
    let grandPending = 0;
    let grandOverdue = 0;
    let totalNonHolidayPayoutsUpToToday = 0;
    let totalCreditedCount = 0;
    let totalPayoutsCount = 0;
    
    let planSummariesText = '';

    plans.forEach((p, idx) => {
      const pStats = getPlanStats(p);
      
      grandInvested += pStats.totalInvested;
      grandExpected += pStats.totalExpected;
      grandCredited += pStats.totalCredited;
      grandPending += pStats.totalPending;
      grandOverdue += pStats.totalOverdue;
      totalCreditedCount += pStats.creditedCount;
      totalPayoutsCount += pStats.totalPayouts;
      
      // Calculate non-holiday up to today for overall rate
      p.payouts.forEach((pay) => {
        if (!pay.isHoliday && pay.date <= todayStr) {
          totalNonHolidayPayoutsUpToToday++;
        }
      });

      let healthEmoji = '🟢';
      let healthStatus = 'On Track';
      if (pStats.overdueCount > 0) {
        healthEmoji = '⏳';
        healthStatus = `${pStats.overdueCount} Overdue`;
      } else if (pStats.lateCount > 0) {
        healthEmoji = '💳';
        healthStatus = `${pStats.lateCount} Late Paid`;
      }

      let frequencyLabel: string = p.payoutType;
      if (p.payoutType === 'weekly' && p.weeklyPayoutDay !== undefined) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        frequencyLabel = `Weekly (${days[p.weeklyPayoutDay]})`;
      } else if (p.payoutType === 'monthly' && p.monthlyPayoutDate !== undefined) {
        const suffix = p.monthlyPayoutDate === 1 || p.monthlyPayoutDate === 21 || p.monthlyPayoutDate === 31 ? 'st' : p.monthlyPayoutDate === 2 || p.monthlyPayoutDate === 22 ? 'nd' : p.monthlyPayoutDate === 3 || p.monthlyPayoutDate === 23 ? 'rd' : 'th';
        frequencyLabel = `Monthly (${p.monthlyPayoutDate}${suffix})`;
      }

      planSummariesText += `\n*${idx + 1}. ${p.name}* [${healthEmoji} ${healthStatus}]\n`;
      planSummariesText += `  • Capital Invested: ₹${pStats.totalInvested.toLocaleString('en-IN')}\n`;
      planSummariesText += `  • Expected Payouts: ₹${pStats.totalExpected.toLocaleString('en-IN')} (${pStats.roi.toFixed(1)}% ROI)\n`;
      planSummariesText += `  • Received to Date: ₹${pStats.totalCredited.toLocaleString('en-IN')} (${pStats.creditedCount}/${pStats.totalPayouts} payouts)\n`;
      planSummariesText += `  • Collection Rate: ${pStats.collectionRate.toFixed(1)}%\n`;
      planSummariesText += `  • Overdue Amount: ₹${pStats.totalOverdue.toLocaleString('en-IN')}\n`;
      planSummariesText += `  • Pending Amount: ₹${pStats.totalPending.toLocaleString('en-IN')}\n`;
      planSummariesText += `  • Schedule: ${frequencyLabel} | ${p.startDate} to ${p.endDate}\n`;
    });

    const overallCollectionRate = totalNonHolidayPayoutsUpToToday > 0 
      ? (totalCreditedCount / totalNonHolidayPayoutsUpToToday) * 100 
      : 100;

    const overallNetProfitExpected = grandExpected - grandInvested;
    const overallNetProfitActual = grandCredited - grandInvested;

    let text = `*📊 PANDATHINGS PROFIT ANALYZER - CONSOLIDATED SUMMARY 📊*\n`;
    text += `_Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}_\n\n`;
    
    text += `*================================*\n`;
    text += `*📈 GRAND TOTALS & METRICS*\n`;
    text += `*================================*\n`;
    text += `💰 *Total Capital Invested:* ₹${grandInvested.toLocaleString('en-IN')}\n`;
    text += `🎯 *Total Expected Returns:* ₹${grandExpected.toLocaleString('en-IN')}\n`;
    text += `💸 *Overall Net Profit (Expected):* ${overallNetProfitExpected >= 0 ? '+' : ''}₹${overallNetProfitExpected.toLocaleString('en-IN')}\n`;
    text += `💵 *Total Received/Credited:* ₹${grandCredited.toLocaleString('en-IN')} (${totalCreditedCount}/${totalPayoutsCount} total payouts)\n`;
    text += `🎉 *Overall Net Profit (Actual):* ${overallNetProfitActual >= 0 ? '+' : ''}₹${overallNetProfitActual.toLocaleString('en-IN')}\n`;
    text += `⚠️ *Total Overdue Balance:* ₹${grandOverdue.toLocaleString('en-IN')}\n`;
    text += `⏳ *Total Pending Balance:* ₹${grandPending.toLocaleString('en-IN')}\n`;
    text += `📈 *Overall Collection Rate:* ${overallCollectionRate.toFixed(1)}%\n\n`;

    text += `*================================*\n`;
    text += `*📋 INDIVIDUAL INVESTMENT DETAILS*\n`;
    text += `*================================*\n`;
    text += planSummariesText;
    
    text += `\n*--------------------------------*\n`;
    text += `_Generated via PandaApps Profit Analyzer_`;

    navigator.clipboard.writeText(text).then(() => {
      alert('Consolidated investment summary successfully copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy to clipboard', err);
      alert('Failed to copy summary to clipboard. Please check console logs.');
    });
  };

  const activePlan = plans.find((p) => p.id === selectedPlanId) || null;

  // Compute metrics
  const getPlanStats = (plan: InvestmentPlan) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalInvested = plan.amount;
    
    let totalExpected = 0;
    let totalCredited = 0;
    let totalOverdue = 0;
    let totalPending = 0;
    let creditedCount = 0;
    let holidayCount = 0;
    let lateCount = 0;
    let totalDelayDays = 0;
    let nonHolidayPayoutsUpToToday = 0;
    let overdueCount = 0;
    let pendingCount = 0;

    plan.payouts.forEach((p) => {
      if (p.isHoliday) {
        holidayCount++;
        return;
      }
      
      totalExpected += p.amount;
      if (p.date <= todayStr) {
        nonHolidayPayoutsUpToToday++;
      }

      if (p.status === 'credited') {
        const received = p.receivedAmount !== undefined ? p.receivedAmount : p.amount;
        totalCredited += received;
        creditedCount++;

        if (p.creditedDate && p.creditedDate > p.date) {
          lateCount++;
          const scheduled = new Date(p.date);
          const credited = new Date(p.creditedDate);
          if (!isNaN(scheduled.getTime()) && !isNaN(credited.getTime())) {
            const diffMs = credited.getTime() - scheduled.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
              totalDelayDays += diffDays;
            }
          }
        }
      } else if (p.date < todayStr) {
        totalOverdue += p.amount;
        overdueCount++;
      } else {
        totalPending += p.amount;
        pendingCount++;
      }
    });

    const roi = totalInvested > 0 ? (totalExpected / totalInvested) * 100 : 0;
    const avgDelay = lateCount > 0 ? totalDelayDays / lateCount : 0;
    const netProfit = totalCredited - totalInvested;
    const collectionRate = nonHolidayPayoutsUpToToday > 0 ? (creditedCount / nonHolidayPayoutsUpToToday) * 100 : 100;

    return {
      totalInvested,
      totalExpected,
      totalCredited,
      totalOverdue,
      totalPending,
      creditedCount,
      holidayCount,
      totalPayouts: plan.payouts.length,
      roi,
      lateCount,
      avgDelay,
      netProfit,
      collectionRate,
      overdueCount,
      pendingCount,
      expectedCount: plan.payouts.length - holidayCount,
    };
  };

  const stats = activePlan ? getPlanStats(activePlan) : null;

  // Plain Text Exporter
  const handleExportText = () => {
    if (!activePlan || !stats) return;

    let textContent = `PANDATHINGS - PROFIT ANALYZER STATEMENT\n`;
    textContent += `==========================================\n`;
    textContent += `Plan Name: ${activePlan.name}\n`;
    textContent += `Investment Capital: INR ${activePlan.amount.toLocaleString('en-IN')}\n`;
    textContent += `Frequency: ${activePlan.payoutType.toUpperCase()}\n`;
    textContent += `Start Date: ${activePlan.startDate}\n`;
    textContent += `End Date: ${activePlan.endDate}\n`;
    textContent += `------------------------------------------\n`;
    textContent += `INSIGHTS & CALCULATION SUMMARY\n`;
    textContent += `------------------------------------------\n`;
    textContent += `Total Capital Invested:   INR ${stats.totalInvested.toLocaleString('en-IN')}\n`;
    textContent += `Total Expected Returns:   INR ${stats.totalExpected.toLocaleString('en-IN')}\n`;
    textContent += `Total Amount Credited:    INR ${stats.totalCredited.toLocaleString('en-IN')} (${stats.creditedCount}/${stats.totalPayouts} payouts)\n`;
    textContent += `Total Amount Overdue:     INR ${stats.totalOverdue.toLocaleString('en-IN')}\n`;
    textContent += `Total Amount Pending:     INR ${stats.totalPending.toLocaleString('en-IN')}\n`;
    textContent += `Holidays Accounted:       ${stats.holidayCount} days\n`;
    if (stats.lateCount > 0) {
      textContent += `Late Payouts:             ${stats.lateCount} (avg. delay ${stats.avgDelay.toFixed(1)} days)\n`;
    }
    textContent += `Net Return on Investment: ${stats.roi.toFixed(2)}%\n`;
    textContent += `==========================================\n`;
    textContent += `PAYOUT SCHEDULE LOG\n`;
    textContent += `==========================================\n`;
    textContent += `Date         | Expected (INR) | Status    \n`;
    textContent += `-------------|----------------|-----------\n`;

    activePlan.payouts.forEach((p) => {
      let statusStr = p.status.toUpperCase();
      const activeVal = p.status === 'credited' && p.receivedAmount !== undefined ? p.receivedAmount : p.amount;

      if (p.isHoliday) statusStr = 'HOLIDAY 🏖️';
      else if (p.status === 'credited') {
        const isLate = p.creditedDate && p.creditedDate > p.date;
        statusStr = `CREDITED ✅ (Recv ₹${activeVal.toLocaleString('en-IN')}${isLate ? ` on ${p.creditedDate} LATE` : ''})`;
      }
      else if (p.date < new Date().toISOString().split('T')[0]) statusStr = 'OVERDUE ⚠️';
      else statusStr = 'PENDING ⏳';

      textContent += `${p.date}   | ${p.amount.toString().padEnd(14)} | ${statusStr}\n`;
    });

    const element = document.createElement('a');
    const file = new Blob([textContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${activePlan.name.toLowerCase().replace(/\s+/g, '_')}_statement.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // WhatsApp clipboard formatting
  const handleCopyWhatsApp = () => {
    if (!activePlan || !stats) return;

    let text = `*PandaThings - Profit Analyzer Statement*\n`;
    text += `*Plan:* _${activePlan.name}_\n`;
    text += `*Investment Capital:* ₹${activePlan.amount.toLocaleString('en-IN')}\n`;
    text += `*Duration:* ${activePlan.startDate} to ${activePlan.endDate}\n`;
    text += `*Frequency:* ${activePlan.payoutType.toUpperCase()}\n\n`;
    text += `*--- SUMMARY STATISTICS ---*\n`;
    text += `💰 *Capital Invested:* ₹${stats.totalInvested.toLocaleString('en-IN')}\n`;
    text += `📈 *Expected Returns:* ₹${stats.totalExpected.toLocaleString('en-IN')}\n`;
    text += `✅ *Total Credited:* ₹${stats.totalCredited.toLocaleString('en-IN')} (${stats.creditedCount}/${stats.totalPayouts} payouts)\n`;
    if (stats.lateCount > 0) {
      text += `⏱️ *Late Payouts:* ${stats.lateCount} (avg. delay ${stats.avgDelay.toFixed(1)}d)\n`;
    }
    text += `⚠️ *Total Overdue:* ₹${stats.totalOverdue.toLocaleString('en-IN')}\n`;
    text += `⏳ *Total Pending:* ₹${stats.totalPending.toLocaleString('en-IN')}\n`;
    text += `🏖️ *Holidays:* ${stats.holidayCount} days\n`;
    text += `📊 *Return on Investment (ROI):* ${stats.roi.toFixed(2)}%\n\n`;
    
    text += `*--- CREDITED & OVERDUE DETAILS ---*\n`;
    
    let logged = 0;
    activePlan.payouts.forEach((p) => {
      const isOverdue = p.status === 'uncredited' && p.date < new Date().toISOString().split('T')[0];
      if (p.status === 'credited' || isOverdue || p.isHoliday) {
        let statusEmoji = '✅';
        const activeVal = p.status === 'credited' && p.receivedAmount !== undefined ? p.receivedAmount : p.amount;
        let detailText = `Credited ₹${activeVal.toLocaleString('en-IN')}`;

        if (p.isHoliday) {
          statusEmoji = '🏖️';
          detailText = 'Holiday';
        } else if (isOverdue) {
          statusEmoji = '⚠️';
          detailText = `*OVERDUE* (Scheduled: ₹${p.originalAmount.toLocaleString('en-IN')})`;
        } else if (p.status === 'credited') {
          const isLate = p.creditedDate && p.creditedDate > p.date;
          if (isLate) {
            statusEmoji = '⏱️';
            detailText = `Credited ₹${activeVal.toLocaleString('en-IN')} (*LATE* on ${p.creditedDate})`;
          }
        }
        
        text += `- ${p.date}: ${statusEmoji} ${detailText}\n`;
        logged++;
      }
    });

    if (logged === 0) {
      text += `No payouts credited or overdue yet.\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      alert('Statement copied to clipboard! You can now paste it into WhatsApp.');
    }).catch(err => {
      console.error('Failed to copy text', err);
    });
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (isLoadingPlans) {
    return (
      <main className="app-container animate-fade-in no-print">
        <div className="loading-state glass-panel" style={{ textAlign: 'center', padding: '80px 32px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto', width: '48px', height: '48px', border: '3px solid rgba(255, 255, 255, 0.05)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
            Retrieving details from cloud database...
          </p>
        </div>
      </main>
    );
  }

  // --- 1. LANDING PAGE VIEW (When no plan is selected) ---
  if (selectedPlanId === '') {
    let grandInvested = 0;
    let grandExpected = 0;
    let grandCredited = 0;
    let grandPending = 0;
    let grandOverdue = 0;
    let totalNonHolidayPayoutsUpToToday = 0;
    let totalCreditedCount = 0;
    let totalPayoutsCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    plans.forEach((plan) => {
      const pStats = getPlanStats(plan);
      grandInvested += pStats.totalInvested;
      grandExpected += pStats.totalExpected;
      grandCredited += pStats.totalCredited;
      grandPending += pStats.totalPending;
      grandOverdue += pStats.totalOverdue;
      totalCreditedCount += pStats.creditedCount;
      totalPayoutsCount += pStats.totalPayouts;

      plan.payouts.forEach((pay) => {
        if (!pay.isHoliday && pay.date <= todayStr) {
          totalNonHolidayPayoutsUpToToday++;
        }
      });
    });

    const overallCollectionRate = totalNonHolidayPayoutsUpToToday > 0 
      ? (totalCreditedCount / totalNonHolidayPayoutsUpToToday) * 100 
      : 100;

    const overallRoi = grandInvested > 0 ? (grandExpected / grandInvested) * 100 : 0;
    const overallNetProfitExpected = grandExpected - grandInvested;
    const overallNetProfitActual = grandCredited - grandInvested;

    return (
      <main className="app-container animate-fade-in">
        <style>{`
          .landing-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 32px;
            margin-top: 16px;
          }

          .landing-title h1 {
            font-size: 2.2rem;
            font-family: var(--font-display);
            background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 4px;
          }

          .landing-title p {
            color: var(--text-secondary);
            font-size: 0.95rem;
          }

          .overview-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }

          .overview-card {
            padding: 24px;
            border-radius: var(--radius-md);
            background: rgba(255, 255, 255, 0.01);
            border: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
          }

          .overview-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--accent-purple);
            opacity: 0.7;
          }

          .overview-card.credited::before {
            background: var(--color-success);
          }

          .overview-card.overdue::before {
            background: var(--color-error);
          }

          .overview-card.roi::before {
            background: var(--accent-purple);
          }

          .overview-card.expected::before {
            background: var(--accent-purple);
          }

          .overview-card.net-profit::before {
            background: var(--color-success);
          }

          .overview-card.net-profit-neg::before {
            background: var(--color-error);
          }

          .overview-card.pending::before {
            background: var(--color-warning);
          }

          .overview-card.collection-rate::before {
            background: #00b4d8;
          }

          .overview-card:hover {
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.03);
          }

          .overview-label {
            font-size: 0.8rem;
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .overview-value {
            font-size: 1.6rem;
            font-weight: 700;
            font-family: var(--font-display);
          }

          .overview-value.credited {
            color: var(--color-success);
          }

          .overview-value.overdue {
            color: var(--color-error);
          }

          .plans-section-title {
            font-family: var(--font-display);
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 20px;
          }

          .plans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 24px;
            margin-bottom: 48px;
          }

          .plan-card {
            padding: 24px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            gap: 16px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            background: rgba(255, 255, 255, 0.01);
          }

          .plan-card:hover {
            transform: translateY(-4px);
            border-color: rgba(142, 84, 255, 0.3);
            background: rgba(142, 84, 255, 0.01);
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
          }

          .plan-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
          }

          .plan-card-title {
            font-family: var(--font-display);
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
            line-height: 1.3;
          }

          .plan-card-amount {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--text-primary);
          }

          .plan-card-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 0.75rem;
          }

          .plan-card-dates {
            font-size: 0.8rem;
            color: var(--text-secondary);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .plan-card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid var(--border-color);
            padding-top: 16px;
            margin-top: auto;
          }

          .plan-card-link {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--accent-purple);
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .plan-card:hover .plan-card-link svg {
            transform: translateX(4px);
          }

          .plan-card-link svg {
            transition: transform 0.2s ease;
          }

          .plan-progress-wrapper {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 0.75rem;
            color: var(--text-secondary);
          }

          .plan-progress-bar {
            height: 4px;
            background: rgba(255, 255, 255, 0.06);
            border-radius: 2px;
            overflow: hidden;
          }

          .plan-progress-fill {
            height: 100%;
            background: var(--accent-purple);
            border-radius: 2px;
            transition: width 0.3s ease;
          }

          .sql-accordion {
            margin-top: 48px;
            padding: 24px;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
          }

          .sql-accordion summary {
            font-family: var(--font-display);
            font-weight: 600;
            color: var(--text-secondary);
            cursor: pointer;
            user-select: none;
            outline: none;
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            transition: color 0.2s ease;
          }

          .back-link:hover {
            color: var(--text-primary);
          }
        `}</style>

        {/* Sync Warning Header Banner */}
        <div className="no-print">
          <SyncBanner status={syncStatus} onRetry={handleRetrySync} />
        </div>

        {/* Header Section */}
        <div className="landing-header no-print">
          <div className="landing-title">
            <Link href="/ledgerweb" className="back-link" style={{ marginBottom: '8px', display: 'inline-block' }}>
              ← Back to Dashboard
            </Link>
            <h1>Profit Analyzer</h1>
            <p>Track, schedule, and analyze your investment returns.</p>
          </div>
          
          <button
            type="button"
            className="glass-button primary"
            onClick={() => {
              setPlanToEdit(undefined);
              setIsModalOpen(true);
            }}
          >
            + Create Investment Plan
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="empty-state glass-panel no-print" style={{ textAlign: 'center', padding: '80px 32px' }}>
            <div className="empty-icon" style={{ fontSize: '3.5rem', marginBottom: '8px' }}>📈</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>No Investment Plans Yet</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 auto' }}>
              Set up an investment returns schedule to track daily, weekly, or monthly payouts, manage holiday corrections, and analyze ROI.
            </p>
            <button
              type="button"
              className="glass-button primary"
              onClick={() => {
                setPlanToEdit(undefined);
                setIsModalOpen(true);
              }}
              style={{ marginTop: '20px' }}
            >
              Create Your First Plan
            </button>
          </div>
        ) : (
          <>
            {/* Overview Statistics Panel */}
            <section className="overview-stats no-print">
              <div className="overview-card">
                <span className="overview-label">Total Capital Invested</span>
                <span className="overview-value">₹{grandInvested.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="overview-card expected">
                <span className="overview-label">Total Expected Returns</span>
                <span className="overview-value" style={{ color: 'var(--accent-purple)' }}>
                  ₹{grandExpected.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {overallRoi.toFixed(2)}% ROI Target
                </span>
              </div>

              <div className={`overview-card ${overallNetProfitExpected >= 0 ? 'net-profit' : 'net-profit-neg'}`}>
                <span className="overview-label">Net Profit (Expected)</span>
                <span className="overview-value" style={{ color: overallNetProfitExpected >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {overallNetProfitExpected >= 0 ? '+' : ''}₹{overallNetProfitExpected.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Expected - Invested
                </span>
              </div>

              <div className="overview-card credited">
                <span className="overview-label">Total Received/Credited</span>
                <span className="overview-value credited">₹{grandCredited.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {totalCreditedCount} / {totalPayoutsCount} payouts
                </span>
              </div>

              <div className={`overview-card ${overallNetProfitActual >= 0 ? 'net-profit' : 'net-profit-neg'}`}>
                <span className="overview-label">Net Profit (Actual)</span>
                <span className="overview-value" style={{ color: overallNetProfitActual >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {overallNetProfitActual >= 0 ? '+' : ''}₹{overallNetProfitActual.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Credited - Invested
                </span>
              </div>

              <div className="overview-card collection-rate">
                <span className="overview-label">Overall Collection Rate</span>
                <span className="overview-value" style={{ color: '#00b4d8' }}>
                  {overallCollectionRate.toFixed(1)}%
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Of expected payouts to date
                </span>
              </div>

              <div className="overview-card pending">
                <span className="overview-label">Total Pending Balance</span>
                <span className="overview-value" style={{ color: 'var(--color-warning)' }}>
                  ₹{grandPending.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Future scheduled payouts
                </span>
              </div>

              <div className="overview-card overdue">
                <span className="overview-label">Total Overdue Balance</span>
                <span className="overview-value overdue">₹{grandOverdue.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Uncredited past scheduled payouts
                </span>
              </div>
            </section>

            {/* Investment Plans Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }} className="no-print">
              <h2 className="plans-section-title" style={{ margin: 0 }}>My Investment Plans ({plans.length})</h2>
              <button
                type="button"
                className="glass-button primary"
                onClick={handleCopyAllPlansSummary}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  background: 'rgba(142, 84, 255, 0.1)',
                  border: '1px solid rgba(142, 84, 255, 0.3)',
                  color: 'var(--accent-purple)',
                  cursor: 'pointer'
                }}
              >
                📋 Copy Consolidated Summary
              </button>
            </div>
            
            <div className="plans-grid">
              {plans.map((p) => {
                const pStats = getPlanStats(p);
                const progressPct = pStats.totalPayouts > 0 ? (pStats.creditedCount / pStats.totalPayouts) * 100 : 0;

                let frequencyLabel: string = p.payoutType;
                if (p.payoutType === 'weekly' && p.weeklyPayoutDay !== undefined) {
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  frequencyLabel = `Weekly (${days[p.weeklyPayoutDay]})`;
                } else if (p.payoutType === 'monthly' && p.monthlyPayoutDate !== undefined) {
                  const suffix = p.monthlyPayoutDate === 1 || p.monthlyPayoutDate === 21 || p.monthlyPayoutDate === 31 ? 'st' : p.monthlyPayoutDate === 2 || p.monthlyPayoutDate === 22 ? 'nd' : p.monthlyPayoutDate === 3 || p.monthlyPayoutDate === 23 ? 'rd' : 'th';
                  frequencyLabel = `Monthly (${p.monthlyPayoutDate}${suffix})`;
                }

                const overdueCount = pStats.overdueCount;
                const lateCount = pStats.lateCount;
                let healthBadge = null;
                if (overdueCount > 0) {
                  healthBadge = (
                    <span className="badge" style={{ background: 'rgba(255, 159, 10, 0.1)', border: '1px solid rgba(255, 159, 10, 0.3)', color: 'var(--color-warning)', fontWeight: '600', padding: '2px 6px', fontSize: '0.7rem' }}>
                      ⏳ {overdueCount} Overdue
                    </span>
                  );
                } else if (lateCount > 0) {
                  healthBadge = (
                    <span className="badge" style={{ background: 'rgba(0, 180, 216, 0.1)', border: '1px solid rgba(0, 180, 216, 0.3)', color: '#00b4d8', fontWeight: '600', padding: '2px 6px', fontSize: '0.7rem' }}>
                      💳 {lateCount} Late Paid
                    </span>
                  );
                } else {
                  healthBadge = (
                    <span className="badge" style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', color: '#00e676', fontWeight: '600', padding: '2px 6px', fontSize: '0.7rem' }}>
                      🟢 On Track
                    </span>
                  );
                }

                return (
                  <div
                    key={p.id}
                    className="plan-card glass-panel"
                    onClick={() => setSelectedPlanId(p.id)}
                  >
                    <div className="plan-card-header">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span className="plan-card-title">{p.name}</span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {healthBadge}
                        </div>
                      </div>
                      <span className="plan-card-amount">₹{p.amount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="plan-card-meta">
                      <span className="badge badge-holiday" style={{ textTransform: 'capitalize' }}>
                        {frequencyLabel}
                      </span>
                      {p.dailySkipWeekends && (
                        <span className="badge badge-holiday">Skipping Weekends</span>
                      )}
                      {p.includeLastPayoutAfterEndDate && (
                        <span className="badge badge-holiday">Including Last Extra Payout</span>
                      )}
                    </div>

                    <div className="plan-progress-wrapper">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <span>Credited Payouts</span>
                        <span>{pStats.creditedCount} / {pStats.totalPayouts}</span>
                      </div>
                      <div className="plan-progress-bar" style={{ marginBottom: '8px' }}>
                        <div className="plan-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span>Received: <strong style={{ color: 'var(--color-success)' }}>₹{pStats.totalCredited.toLocaleString('en-IN')}</strong></span>
                        <span>Target: <strong>₹{pStats.totalExpected.toLocaleString('en-IN')}</strong></span>
                      </div>
                    </div>

                    <div className="plan-card-dates">
                      <span>Start: <strong>{p.startDate}</strong></span>
                      <span>End: <strong>{p.endDate}</strong></span>
                    </div>

                    <div className="plan-card-footer">
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {pStats.roi.toFixed(1)}% ROI
                      </span>
                      <span className="plan-card-link">
                        View Details
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* PostgreSQL / Upstash Integration Guide */}
        <section className="sql-accordion glass-panel no-print">
          <details>
            <summary>🛠️ Upstash Redis Database Integration Guide</summary>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.4' }}>
              Your data is automatically synced in real-time to your core <strong>Upstash Redis</strong> database. 
              No manual table creation, migrations, or setup scripts are needed! Key-value storage is fully managed and configured out of the box using your platform credentials.
            </p>
          </details>
        </section>

        {/* Dynamic plan creation modal popup */}
        <NewPlanModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setPlanToEdit(undefined);
          }}
          onSave={handleCreatePlan}
          planToEdit={planToEdit}
        />
      </main>
    );
  }

  // --- 2. PLAN DETAILS WORKSPACE VIEW ---
  return (
    <main className="app-container animate-fade-in">
      <style>{`
        .header-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          margin-top: 16px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s ease;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .back-link:hover {
          color: var(--text-primary);
        }

        .workspace-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 968px) {
          .workspace-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Sidebar plans list styling */
        .plans-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sidebar-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          color: var(--text-secondary);
          font-weight: 600;
          margin-bottom: 8px;
        }

        .plan-item-card {
          padding: 20px;
          cursor: pointer;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.25s ease;
          border: 1px solid var(--border-color);
        }

        .plan-item-card:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .plan-item-card.active {
          border-color: var(--accent-purple);
          background: rgba(142, 84, 255, 0.03);
          box-shadow: 0 0 16px rgba(142, 84, 255, 0.05);
        }

        .plan-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .plan-item-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 600;
          line-height: 1.3;
          color: var(--text-primary);
        }

        .plan-item-amount {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .plan-progress-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .plan-progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 2px;
          overflow: hidden;
        }

        .plan-progress-fill {
          height: 100%;
          background: var(--accent-purple);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        /* Workspace details styling */
        .details-workspace {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .workspace-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
        }

        .workspace-title-area h2 {
          font-size: 1.75rem;
          margin-bottom: 6px;
          background: linear-gradient(135deg, #ffffff 50%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .workspace-dates {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        /* Calculations grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }

        .stat-card {
          padding: 16px;
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          font-family: var(--font-display);
        }

        .stat-card.roi {
          background: rgba(142, 84, 255, 0.03);
          border-color: rgba(142, 84, 255, 0.15);
        }
        .stat-card.roi .stat-value {
          color: var(--accent-purple);
        }

        .stat-card.credited .stat-value {
          color: var(--color-success);
        }
        .stat-card.overdue .stat-value {
          color: var(--color-error);
        }

        .action-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          padding-bottom: 8px;
        }

        .print-statement {
          display: none;
        }
      `}</style>

      {/* Sync Warning Header Banner */}
      <div className="no-print">
        <SyncBanner status={syncStatus} onRetry={handleRetrySync} />
      </div>

      {/* Nav Header */}
      <div className="header-actions no-print">
        <button
          type="button"
          className="back-link"
          onClick={() => setSelectedPlanId('')}
        >
          ← Back to All Plans
        </button>
        
        <button
          type="button"
          className="glass-button primary"
          onClick={() => {
            setPlanToEdit(undefined);
            setIsModalOpen(true);
          }}
          disabled={isLoadingPlans}
        >
          + Create Investment Plan
        </button>
      </div>

      <div className="workspace-grid">
        {/* Left Panel: Plans Sidebar */}
        <section className="plans-sidebar no-print">
          <h3 className="sidebar-title">Investment Plans</h3>
          {plans.map((p) => {
            const pStats = getPlanStats(p);
            const progressPct = pStats.totalPayouts > 0 ? (pStats.creditedCount / pStats.totalPayouts) * 100 : 0;
            const isActive = p.id === selectedPlanId;

            return (
              <div
                key={p.id}
                className={`plan-item-card glass-panel ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedPlanId(p.id)}
              >
                <div className="plan-item-header">
                   <span className="plan-item-title">{p.name}</span>
                   <span className="plan-item-amount">₹{p.amount.toLocaleString('en-IN')}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-holiday" style={{ padding: '2px 8px', fontSize: '0.65rem', textTransform: 'capitalize' }}>
                    {p.payoutType}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                    {pStats.roi.toFixed(1)}% ROI
                  </span>
                </div>

                <div className="plan-progress-wrapper">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Credited Payouts</span>
                    <span>{pStats.creditedCount} / {pStats.totalPayouts}</span>
                  </div>
                  <div className="plan-progress-bar">
                    <div className="plan-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Right Panel: Active Plan Details */}
        {activePlan && stats && (
          <section className="details-workspace">
            {/* Workspace Header */}
            <div className="workspace-header no-print">
              <div className="workspace-title-area">
                <h2>{activePlan.name}</h2>
                <div className="workspace-dates">
                  <span>Duration: <strong>{activePlan.startDate}</strong> to <strong>{activePlan.endDate}</strong></span>
                  <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                  <span>Frequency: <strong style={{ textTransform: 'capitalize' }}>
                    {activePlan.payoutType === 'weekly' && activePlan.weeklyPayoutDay !== undefined
                      ? `weekly (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][activePlan.weeklyPayoutDay]})`
                      : activePlan.payoutType === 'monthly' && activePlan.monthlyPayoutDate !== undefined
                      ? `monthly (${activePlan.monthlyPayoutDate})`
                      : activePlan.payoutType}
                  </strong></span>
                  {activePlan.dailySkipWeekends && (
                    <>
                      <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                      <span>Skipping Weekends</span>
                    </>
                  )}
                  {activePlan.includeLastPayoutAfterEndDate && (
                    <>
                      <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                      <span>Including Last Extra Payout</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="glass-button"
                  onClick={() => {
                    setPlanToEdit(activePlan);
                    setIsModalOpen(true);
                  }}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  ✏️ Edit Plan
                </button>
                <button
                  type="button"
                  className="glass-button danger"
                  onClick={() => handleDeletePlan(activePlan.id)}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Delete Plan
                </button>
              </div>
            </div>

            {/* Calculations Insights */}
            <div className="stats-grid no-print">
              <div className="stat-card">
                <span className="stat-label">Capital Invested</span>
                <span className="stat-value">₹{stats.totalInvested.toLocaleString('en-IN')}</span>
              </div>
              <div className="stat-card roi">
                <span className="stat-label">Net Return ROI</span>
                <span className="stat-value">{stats.roi.toFixed(2)}%</span>
              </div>
              <div className="stat-card expected">
                <span className="stat-label">Expected Profit</span>
                <span className="stat-value">₹{stats.totalExpected.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {stats.expectedCount} payouts expected
                </span>
              </div>
              <div className="stat-card net-profit" style={{
                borderLeft: '3px solid ' + (stats.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'),
                background: stats.netProfit >= 0 ? 'rgba(0, 230, 118, 0.02)' : 'rgba(255, 59, 48, 0.02)'
              }}>
                <span className="stat-label">Net Profit</span>
                <span className="stat-value" style={{
                  color: stats.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)'
                }}>
                  {stats.netProfit >= 0 ? '+' : ''}₹{stats.netProfit.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  Credited - Invested
                </span>
              </div>
              <div className="stat-card credited">
                <span className="stat-label">Total Credited</span>
                <span className="stat-value">₹{stats.totalCredited.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {stats.creditedCount} payouts completed
                </span>
                {stats.lateCount > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    ⏱️ {stats.lateCount} late (avg. {stats.avgDelay.toFixed(1)}d delay)
                  </span>
                )}
              </div>
              <div className="stat-card collection-rate" style={{
                borderLeft: '3px solid #00b4d8',
                background: 'rgba(0, 180, 216, 0.02)'
              }}>
                <span className="stat-label">Collection Rate</span>
                <span className="stat-value" style={{ color: '#00b4d8' }}>
                  {stats.collectionRate.toFixed(1)}%
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  Of expected payouts to date
                </span>
              </div>
              <div className="stat-card pending">
                <span className="stat-label">Pending</span>
                <span className="stat-value">₹{stats.totalPending.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {stats.pendingCount} payouts pending
                </span>
              </div>
              <div className="stat-card overdue">
                <span className="stat-label">Overdue</span>
                <span className="stat-value">₹{stats.totalOverdue.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {stats.overdueCount} payouts overdue
                </span>
              </div>
            </div>

            {/* Share/Export Utilities */}
            <div className="action-bar no-print">
              <button
                type="button"
                className="glass-button success"
                onClick={handleAutoCreditPastDue}
                style={{
                  color: 'var(--color-success)',
                  background: 'rgba(0, 230, 118, 0.05)',
                  border: '1px solid rgba(0, 230, 118, 0.2)',
                  fontWeight: 'bold',
                }}
              >
                ✅ Auto-Credit All Past Due
              </button>
              <button
                type="button"
                className="glass-button"
                onClick={handleCopyWhatsApp}
              >
                💬 Copy WhatsApp format
              </button>
              <button
                type="button"
                className="glass-button"
                onClick={handleExportText}
              >
                📄 Download Text Report
              </button>
              <button
                type="button"
                className="glass-button"
                onClick={handlePrintPDF}
              >
                🖨️ Save Statement as PDF
              </button>
            </div>

            {/* Monthly Interactive Calendar */}
            <div className="no-print">
              <PlanCalendar
                plan={activePlan}
                onUpdatePlan={handleUpdatePlan}
              />
            </div>

            {/* PDF PRINT-ONLY CONTAINER */}
            <div className="print-statement">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: 0, color: '#000000' }}>PandaThings</h1>
                  <span style={{ fontSize: '10pt', color: '#666' }}>Profit Analyzer Investment Report</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: 0, color: '#000000' }}>{activePlan.name}</h2>
                  <span style={{ fontSize: '10pt', color: '#666' }}>Generated on {new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div>
                  <span style={{ fontSize: '9pt', color: '#666', textTransform: 'uppercase' }}>Plan Configuration</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#000000' }}>Frequency: {activePlan.payoutType.toUpperCase()}</p>
                  <p style={{ margin: '2px 0 0 0', color: '#000000' }}>Period: {activePlan.startDate} to {activePlan.endDate}</p>
                </div>
                <div>
                  <span style={{ fontSize: '9pt', color: '#666', textTransform: 'uppercase' }}>Capital Details</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#000000' }}>Investment Capital: ₹{stats.totalInvested.toLocaleString('en-IN')}</p>
                  <p style={{ margin: '2px 0 0 0', color: '#000000' }}>Expected Profit: ₹{stats.totalExpected.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span style={{ fontSize: '9pt', color: '#666', textTransform: 'uppercase' }}>Performance Summary</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#2e7d32' }}>Total Credited: ₹{stats.totalCredited.toLocaleString('en-IN')}</p>
                  <p style={{ margin: '2px 0 0 0', color: '#000000' }}>Overdue: ₹{stats.totalOverdue.toLocaleString('en-IN')} | ROI: {stats.roi.toFixed(2)}%</p>
                </div>
              </div>

              <h3 style={{ fontSize: '14pt', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '6px', marginBottom: '12px', color: '#000000' }}>Payout Schedule Log</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '1px solid #ccc' }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>Date</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>Payout Value (INR)</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activePlan.payouts.map((p) => {
                    let statusLabel = 'Pending';
                    const activeAmount = p.status === 'credited' && p.receivedAmount !== undefined
                      ? p.receivedAmount
                      : p.amount;

                    if (p.isHoliday) statusLabel = 'Holiday';
                    else if (p.status === 'credited') {
                      const isLate = p.creditedDate && p.creditedDate > p.date;
                      statusLabel = `Credited${isLate ? ` Late (${p.creditedDate})` : ''}`;
                    }
                    else if (p.date < new Date().toISOString().split('T')[0]) statusLabel = 'OVERDUE';

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px', fontSize: '9pt', color: '#000000' }}>
                          {new Date(p.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontSize: '9pt', color: '#000000' }}>
                          ₹{activeAmount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center', fontSize: '9pt', color: '#000000', fontWeight: statusLabel === 'OVERDUE' ? 'bold' : 'normal' }}>
                          {statusLabel}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Upstash Redis Integration Guide */}
      <section className="sql-accordion glass-panel no-print">
        <details>
          <summary>🛠️ Upstash Redis Database Integration Guide</summary>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.4' }}>
            Your data is automatically synced in real-time to your core <strong>Upstash Redis</strong> database. 
            No manual table creation, migrations, or setup scripts are needed! Key-value storage is fully managed and configured out of the box using your platform credentials.
          </p>
        </details>
      </section>

      {/* Dynamic plan creation modal popup */}
      <NewPlanModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPlanToEdit(undefined);
        }}
        onSave={handleCreatePlan}
        planToEdit={planToEdit}
      />
    </main>
  );
}
