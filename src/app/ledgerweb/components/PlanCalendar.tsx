'use client';

import React, { useState, useEffect } from 'react';
import { InvestmentPlan } from '../services/db';
import { Payout, recalculatePayouts } from '../utils/payoutGenerator';

const getLocalDateString = (date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

interface PlanCalendarProps {
  plan: InvestmentPlan;
  onUpdatePlan: (updatedPlan: InvestmentPlan) => void;
}

export const PlanCalendar: React.FC<PlanCalendarProps> = ({
  plan,
  onUpdatePlan,
}) => {
  // Initialize to the start date of the plan
  const [viewDate, setViewDate] = useState(() => {
    return new Date(plan.startDate);
  });
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Popover form states
  const [actualCreditDate, setActualCreditDate] = useState<string>('');
  const [actualReceivedAmount, setActualReceivedAmount] = useState<number | ''>('');

  const [filter, setFilter] = useState<'all' | 'credited' | 'pending' | 'overdue' | 'holiday'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local state to track editing values before blur/save
  const [editStates, setEditStates] = useState<Record<string, { creditedDate?: string; receivedAmount?: string }>>({});

  // Sync calendar view month when the plan changes
  useEffect(() => {
    setViewDate(new Date(plan.startDate));
  }, [plan.id]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Helper to format date as YYYY-MM-DD in local time
  const formatDateKey = (yearNum: number, monthNum: number, dayNum: number) => {
    const yyyy = yearNum;
    const mm = String(monthNum + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getLocalDateString();

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 6 = Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Create an index of payouts by expected scheduled date
  const payoutsByExpectedDate = plan.payouts.reduce((acc, p) => {
    acc[p.date] = p;
    return acc;
  }, {} as Record<string, Payout>);

  // Create an index of payouts by actual credited date
  const payoutsByCreditedDate = plan.payouts.reduce((acc, p) => {
    if (p.status === 'credited' && p.creditedDate) {
      if (!acc[p.creditedDate]) {
        acc[p.creditedDate] = [];
      }
      acc[p.creditedDate].push(p);
    }
    return acc;
  }, {} as Record<string, Payout[]>);

  // Sync form state when a date is selected
  useEffect(() => {
    if (selectedDate) {
      const payout = plan.payouts.find(p => p.date === selectedDate);
      if (payout) {
        setActualCreditDate(payout.creditedDate || getLocalDateString());
        setActualReceivedAmount(payout.receivedAmount !== undefined ? payout.receivedAmount : payout.amount);
      } else {
        setActualCreditDate('');
        setActualReceivedAmount('');
      }
    }
  }, [selectedDate, plan.id, plan.payouts]);

  const handleSaveCreditDetails = () => {
    if (!selectedDate) return;
    const payout = payoutsByExpectedDate[selectedDate];
    if (!payout) return;

    const updatedPayouts = plan.payouts.map((p) => {
      if (p.date === selectedDate) {
        return {
          ...p,
          status: 'credited' as const,
          creditedDate: actualCreditDate || p.date,
          receivedAmount: actualReceivedAmount !== '' ? Number(actualReceivedAmount) : p.amount,
        };
      }
      return p;
    });

    const updatedPlan = {
      ...plan,
      payouts: updatedPayouts,
    };

    onUpdatePlan(recalculatePayouts(updatedPlan));
    setSelectedDate(null);
  };

  const handleMarkAsUncredited = () => {
    if (!selectedDate) return;
    const payout = payoutsByExpectedDate[selectedDate];
    if (!payout) return;

    const updatedPayouts = plan.payouts.map((p) => {
      if (p.date === selectedDate) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { creditedDate, receivedAmount, ...rest } = p;
        return {
          ...rest,
          status: 'uncredited' as const,
        };
      }
      return p;
    });

    const updatedPlan = {
      ...plan,
      payouts: updatedPayouts,
    };

    onUpdatePlan(recalculatePayouts(updatedPlan));
    setSelectedDate(null);
  };

  const handleToggleHoliday = () => {
    if (!selectedDate) return;
    
    const isHoliday = plan.holidays?.includes(selectedDate) || false;
    let newHolidays = plan.holidays ? [...plan.holidays] : [];
    
    if (isHoliday) {
      newHolidays = newHolidays.filter(h => h !== selectedDate);
    } else {
      newHolidays.push(selectedDate);
    }

    const updatedPlan = recalculatePayouts({
      ...plan,
      holidays: newHolidays
    });

    onUpdatePlan(updatedPlan);
  };

  const handleUpdatePayout = (
    payoutDate: string,
    fields: {
      status?: 'credited' | 'uncredited' | 'holiday';
      creditedDate?: string;
      receivedAmount?: number;
    }
  ) => {
    let newHolidays = plan.holidays ? [...plan.holidays] : [];
    
    if (fields.status === 'holiday') {
      if (!newHolidays.includes(payoutDate)) {
        newHolidays.push(payoutDate);
      }
    } else if (fields.status === 'credited' || fields.status === 'uncredited') {
      newHolidays = newHolidays.filter(h => h !== payoutDate);
    }

    const updatedPayouts = plan.payouts.map((p) => {
      if (p.date === payoutDate) {
        if (fields.status === 'holiday') {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { creditedDate, receivedAmount, ...rest } = p;
          return {
            ...rest,
            status: 'uncredited' as const,
            isHoliday: true,
            amount: plan.payoutType === 'daily' ? 0 : p.amount
          };
        } else if (fields.status === 'credited') {
          const credDate = fields.creditedDate !== undefined ? fields.creditedDate : (p.creditedDate || p.date);
          const recvAmt = fields.receivedAmount !== undefined ? fields.receivedAmount : (p.receivedAmount !== undefined ? p.receivedAmount : p.amount);
          return {
            ...p,
            status: 'credited' as const,
            isHoliday: false,
            creditedDate: credDate,
            receivedAmount: recvAmt
          };
        } else if (fields.status === 'uncredited') {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { creditedDate, receivedAmount, ...rest } = p;
          return {
            ...rest,
            status: 'uncredited' as const,
            isHoliday: false
          };
        } else {
          const updatedPayout = { ...p };
          if (fields.creditedDate !== undefined) {
            updatedPayout.creditedDate = fields.creditedDate;
          }
          if (fields.receivedAmount !== undefined) {
            updatedPayout.receivedAmount = fields.receivedAmount;
          }
          return updatedPayout;
        }
      }
      return p;
    });

    const updatedPlan = {
      ...plan,
      holidays: newHolidays,
      payouts: updatedPayouts
    };

    onUpdatePlan(recalculatePayouts(updatedPlan));
  };

  const saveRow = (payoutDate: string) => {
    const state = editStates[payoutDate];
    if (!state) return;

    const updates: any = {};
    if (state.creditedDate !== undefined) {
      updates.creditedDate = state.creditedDate;
    }
    if (state.receivedAmount !== undefined) {
      const val = state.receivedAmount === '' ? undefined : Number(state.receivedAmount);
      updates.receivedAmount = val;
    }

    handleUpdatePayout(payoutDate, updates);

    setEditStates((prev) => {
      const copy = { ...prev };
      delete copy[payoutDate];
      return copy;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, payoutDate: string) => {
    if (e.key === 'Enter') {
      saveRow(payoutDate);
      (e.target as HTMLElement).blur();
    }
  };

  const formatWeekdayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysLateBadge = (payout: Payout) => {
    const isHoliday = plan.holidays?.includes(payout.date) || false;
    if (isHoliday) {
      return <span style={{ color: 'var(--text-muted)' }}>-</span>;
    }

    if (payout.status === 'credited') {
      const scheduled = new Date(payout.date);
      const credited = new Date(payout.creditedDate || payout.date);
      
      if (isNaN(scheduled.getTime()) || isNaN(credited.getTime())) {
        return <span style={{ color: 'var(--text-muted)' }}>-</span>;
      }
      
      const diffMs = credited.getTime() - scheduled.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        return <span className="late-days-badge late">⏱️ {diffDays} days late</span>;
      } else if (diffDays < 0) {
        return <span className="late-days-badge early">🚀 {Math.abs(diffDays)} days early</span>;
      } else {
        return <span className="late-days-badge ontime">✅ On Time</span>;
      }
    } else {
      if (payout.date < todayStr) {
        const scheduled = new Date(payout.date);
        const today = new Date(todayStr);
        if (isNaN(scheduled.getTime()) || isNaN(today.getTime())) {
          return <span style={{ color: 'var(--text-muted)' }}>-</span>;
        }
        const diffMs = today.getTime() - scheduled.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return <span className="late-days-badge overdue">⚠️ {diffDays} days overdue</span>;
      } else {
        return <span style={{ color: 'var(--text-secondary)' }}>Not due yet</span>;
      }
    }
  };

  const filteredPayouts = plan.payouts.filter((p) => {
    const isHoliday = plan.holidays?.includes(p.date) || false;
    const isOverdue = !isHoliday && p.status === 'uncredited' && p.date < todayStr;
    const isPending = !isHoliday && p.status === 'uncredited' && p.date >= todayStr;

    if (filter === 'credited' && p.status !== 'credited') return false;
    if (filter === 'pending' && !isPending) return false;
    if (filter === 'overdue' && !isOverdue) return false;
    if (filter === 'holiday' && !isHoliday) return false;

    if (searchTerm) {
      const formattedDate = new Date(p.date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).toLowerCase();

      const matchesDate = p.date.includes(searchTerm) || formattedDate.includes(searchTerm.toLowerCase());
      const matchesAmount = String(p.amount).includes(searchTerm) || String(p.originalAmount).includes(searchTerm);
      return matchesDate || matchesAmount;
    }

    return true;
  });

  // Generate day cells
  const renderCells = () => {
    const cells = [];
    
    // Add empty padding days
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const payoutExpected = payoutsByExpectedDate[dateKey];
      const creditedPayouts = payoutsByCreditedDate[dateKey] || [];
      
      // Filter out any credited payout that was credited on time on its expected day,
      // because that is already rendered as the expected payout to avoid duplicates.
      const lateCredits = creditedPayouts.filter(p => p.date !== dateKey);
      
      const inPlanRange = (dateKey >= plan.startDate && dateKey <= plan.endDate) || !!payoutExpected;
      const isHoliday = plan.holidays?.includes(dateKey) || false;
      const isToday = dateKey === todayStr;
      
      let cellClass = 'calendar-cell';
      let borderLeftStyle = '';
      
      if (inPlanRange) {
        cellClass += ' is-range-day';
      }

      if (isHoliday) {
        cellClass += ' is-holiday';
        borderLeftStyle = '3px solid var(--accent-purple)';
      } else if (inPlanRange) {
        // Determine border-left class based on priority of events
        if (payoutExpected && payoutExpected.status === 'uncredited' && payoutExpected.date < todayStr) {
          cellClass += ' is-overdue';
          borderLeftStyle = '3px solid var(--color-error)';
        } else if (lateCredits.length > 0) {
          cellClass += ' is-late-credit';
          borderLeftStyle = '3px solid #00b4d8';
        } else if (payoutExpected && payoutExpected.status === 'credited' && payoutExpected.creditedDate && payoutExpected.creditedDate > payoutExpected.date) {
          cellClass += ' is-expected-spot';
          borderLeftStyle = '3px solid var(--color-warning)';
        } else if (payoutExpected && payoutExpected.status === 'credited') {
          cellClass += ' is-credited';
          borderLeftStyle = '3px solid var(--color-success)';
        } else if (payoutExpected && payoutExpected.status === 'uncredited') {
          cellClass += ' is-pending';
          borderLeftStyle = '3px solid var(--color-warning)';
        }
      }

      if (isToday) {
        cellClass += ' is-today';
      }

      const eventElements: React.ReactNode[] = [];

      if (isHoliday) {
        eventElements.push(
          <div key="holiday" className="event-row holiday" style={{ justifyContent: 'center', background: 'rgba(142, 84, 255, 0.06)', borderLeft: '2px solid var(--accent-purple)', width: '100%' }}>
            <span className="event-badge holiday" style={{ color: 'var(--accent-purple)' }}>🏖️ Holiday</span>
          </div>
        );
      } else if (inPlanRange) {
        // 1. Process expected payout
        if (payoutExpected) {
          if (payoutExpected.status === 'uncredited') {
            const isOverdue = payoutExpected.date < todayStr;
            eventElements.push(
              <div key="expected" className={`event-row ${isOverdue ? 'overdue' : 'pending'}`}>
                <span className="event-amount">₹{payoutExpected.amount.toLocaleString('en-IN')}</span>
                <span className={`event-badge ${isOverdue ? 'overdue' : 'pending'}`}>
                  {isOverdue ? '⚠️ Overdue' : '⏳ Pending'}
                </span>
              </div>
            );
          } else if (payoutExpected.status === 'credited') {
            const isLate = payoutExpected.creditedDate && payoutExpected.creditedDate > payoutExpected.date;
            if (isLate) {
              eventElements.push(
                <div key="expected" className="event-row expected-late">
                  <span className="event-amount">₹{payoutExpected.amount.toLocaleString('en-IN')}</span>
                  <span className="event-badge expected-late">
                    ⏱️ expected
                  </span>
                </div>
              );
            } else {
              const activeAmount = payoutExpected.receivedAmount !== undefined ? payoutExpected.receivedAmount : payoutExpected.amount;
              eventElements.push(
                <div key="expected" className="event-row credited">
                  <span className="event-amount">₹{activeAmount.toLocaleString('en-IN')}</span>
                  <span className="event-badge credited">✓</span>
                </div>
              );
            }
          }
        }

        // 2. Process all late credits received on this day
        lateCredits.forEach((p, idx) => {
          const scheduled = new Date(p.date);
          const credited = new Date(p.creditedDate!);
          const delayMs = credited.getTime() - scheduled.getTime();
          const delayDays = Math.floor(delayMs / (1000 * 60 * 60 * 24));
          const activeAmount = p.receivedAmount !== undefined ? p.receivedAmount : p.amount;

          eventElements.push(
            <div key={`late-${p.id || idx}`} className="event-row late-credit">
              <span className="event-amount">₹{activeAmount.toLocaleString('en-IN')}</span>
              <span className="event-badge late-credit">
                💳 +{delayDays}d
              </span>
            </div>
          );
        });
      }

      cells.push(
        <div
          key={`day-${day}`}
          className={cellClass}
          style={borderLeftStyle ? { borderLeft: borderLeftStyle } : undefined}
          onClick={() => {
            if (inPlanRange) {
              if (payoutExpected) {
                setSelectedDate(payoutExpected.date);
              } else if (creditedPayouts.length > 0) {
                setSelectedDate(creditedPayouts[0].date);
              } else {
                setSelectedDate(dateKey);
              }
            }
          }}
        >
          <div className="cell-header">
            <span className="day-number">{day}</span>
          </div>
          {eventElements.length > 0 && (
            <div className="events-container">
              {eventElements}
            </div>
          )}
        </div>
      );
    }

    return cells;
  };

  // Calculate delay info for selected date
  const getDelayInfo = () => {
    if (!selectedDate) return null;
    const payout = payoutsByExpectedDate[selectedDate];
    if (!payout) return null;

    const scheduled = new Date(payout.date);
    const credited = new Date(actualCreditDate || payout.date);
    
    if (isNaN(scheduled.getTime()) || isNaN(credited.getTime())) return null;

    const delayMs = credited.getTime() - scheduled.getTime();
    const delayDays = Math.floor(delayMs / (1000 * 60 * 60 * 24));

    return {
      delayDays,
      isLate: delayDays > 0,
      isOntime: delayDays === 0,
      isEarly: delayDays < 0,
    };
  };

  const delayInfo = getDelayInfo();

  return (
    <div className="calendar-card glass-panel">
      <style>{`
        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .calendar-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
        }

        .calendar-nav-buttons {
          display: flex;
          gap: 8px;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .grid-header {
          text-align: center;
          font-family: var(--font-display);
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          padding-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .calendar-cell {
          aspect-ratio: 1.1;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-sm);
          padding: 6px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 4px;
          position: relative;
          transition: all 0.2s ease;
          opacity: 0.4;
          min-height: 70px;
        }

        .calendar-cell.empty {
          background: transparent;
          border-color: transparent;
          pointer-events: none;
        }

        .calendar-cell.is-range-day {
          opacity: 1;
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.04);
          cursor: pointer;
        }

        .calendar-cell.is-range-day:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .calendar-cell.is-today {
          border-color: var(--accent-purple) !important;
          background: rgba(142, 84, 255, 0.04) !important;
        }
        
        .calendar-cell.is-today .day-number {
          color: var(--accent-purple);
          font-weight: 700;
        }

        .day-number {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .cell-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .events-container {
          display: flex;
          flex-direction: column;
          gap: 3px;
          width: 100%;
          overflow: hidden;
        }

        .event-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 0.65rem;
          width: 100%;
          line-height: 1.2;
          gap: 4px;
        }

        /* Event Row Styles */
        .event-row.credited {
          background: rgba(0, 230, 118, 0.06);
          border-left: 2px solid var(--color-success);
          color: #ffffff;
        }
        .event-row.pending {
          background: rgba(255, 159, 10, 0.06);
          border-left: 2px solid var(--color-warning);
          color: #ffffff;
        }
        .event-row.overdue {
          background: rgba(255, 59, 48, 0.06);
          border-left: 2px solid var(--color-error);
          color: #ffffff;
        }
        .event-row.expected-late {
          background: rgba(255, 159, 10, 0.06);
          border-left: 2px dashed var(--color-warning);
          color: #ffffff;
        }
        .event-row.late-credit {
          background: rgba(0, 180, 216, 0.06);
          border-left: 2px solid #00b4d8;
          color: #ffffff;
        }

        .event-amount {
          font-weight: 700;
        }

        .event-badge {
          font-size: 0.6rem;
          font-weight: bold;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .event-badge.credited {
          color: var(--color-success);
        }
        .event-badge.pending {
          color: var(--color-warning);
        }
        .event-badge.overdue {
          color: var(--color-error);
        }
        .event-badge.expected-late {
          color: var(--color-warning);
        }
        .event-badge.late-credit {
          color: #00b4d8;
        }

        /* Detail Modal / popover */
        .payout-popover-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(8, 10, 15, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
        }

        .payout-popover {
          width: 95%;
          max-width: 360px;
          padding: 28px;
          border: 1px solid var(--border-color);
        }

        .popover-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          margin-bottom: 8px;
        }

        .popover-detail {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .delay-badge {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .delay-badge.late {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .delay-badge.ontime {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .delay-badge.early {
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }

        .credit-form {
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .payouts-table-container {
          margin-top: 32px;
          border-top: 1px solid var(--border-color);
          padding-top: 24px;
          width: 100%;
        }

        .table-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .table-header-row h4 {
          font-size: 1.2rem;
          margin: 0;
          color: var(--text-primary);
        }

        .table-controls {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .table-filters {
          display: flex;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 2px;
        }

        .filter-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 6px 12px;
          font-size: 0.8rem;
          font-family: var(--font-display);
          font-weight: 500;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          color: var(--text-primary);
        }

        .filter-btn.active {
          background: var(--accent-purple);
          color: var(--text-primary);
        }

        .search-input-wrapper {
          position: relative;
        }

        .table-search {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.8rem;
          outline: none;
          min-width: 180px;
        }

        .table-search:focus {
          border-color: var(--border-focus);
        }

        .payouts-table-wrapper {
          overflow-x: auto;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: rgba(18, 22, 32, 0.4);
          max-height: 400px;
          overflow-y: auto;
        }

        .payouts-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          text-align: left;
        }

        .payouts-table th {
          background: rgba(0, 0, 0, 0.3);
          padding: 12px 16px;
          font-weight: 600;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .payouts-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
          vertical-align: middle;
        }

        .payouts-table tr:hover {
          background: rgba(255, 255, 255, 0.01);
        }

        .payouts-table tr.row-holiday {
          background: rgba(100, 116, 139, 0.03);
        }

        .payouts-table tr.row-holiday td {
          color: var(--text-muted);
        }

        .payout-status-select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 4px 8px;
          font-size: 0.8rem;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
        }

        .payout-status-select:focus {
          border-color: var(--border-focus);
        }

        .payout-date-input {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 4px 8px;
          font-size: 0.8rem;
          border-radius: 4px;
          width: 125px;
          outline: none;
        }
        
        .payout-date-input:focus {
          border-color: var(--border-focus);
        }

        .payout-amount-input {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 4px 8px;
          font-size: 0.8rem;
          border-radius: 4px;
          width: 90px;
          outline: none;
        }
        
        .payout-amount-input:focus {
          border-color: var(--border-focus);
        }

        .late-days-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .late-days-badge.late {
          background: rgba(255, 59, 48, 0.1);
          color: var(--color-error);
        }

        .late-days-badge.overdue {
          background: rgba(255, 159, 10, 0.1);
          color: var(--color-warning);
        }

        .late-days-badge.ontime {
          background: rgba(0, 230, 118, 0.1);
          color: var(--color-success);
        }

        .late-days-badge.early {
          background: rgba(0, 180, 216, 0.1);
          color: #00b4d8;
        }
      `}</style>

      <div className="calendar-header">
        <h3 className="calendar-title">
          {monthNames[month]} {year}
        </h3>
        <div className="calendar-nav-buttons">
          <button
            type="button"
            className="glass-button"
            onClick={handlePrevMonth}
            style={{ padding: '6px 12px' }}
          >
            ←
          </button>
          <button
            type="button"
            className="glass-button"
            onClick={handleNextMonth}
            style={{ padding: '6px 12px' }}
          >
            →
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="grid-header">
            {d}
          </div>
        ))}
        {renderCells()}
      </div>

      <div className="calendar-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓</span> Credited
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--color-warning)' }}>⏳</span> Pending
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--color-error)' }}>⚠️</span> Overdue
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--accent-purple)' }}>🏖️</span> Holiday
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--color-warning)' }}>⏱️ expected</span> Expected (Late)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#00b4d8' }}>💳</span> Late Credit
        </div>
      </div>

      <div className="payouts-table-container">
        <div className="table-header-row">
          <h4>Payouts Schedule Ledger</h4>
          
          <div className="table-controls">
            <div className="table-filters">
              {(['all', 'credited', 'pending', 'overdue', 'holiday'] as const).map((f) => {
                const count = plan.payouts.filter((p) => {
                  const isHoliday = plan.holidays?.includes(p.date) || false;
                  const isOverdue = !isHoliday && p.status === 'uncredited' && p.date < todayStr;
                  const isPending = !isHoliday && p.status === 'uncredited' && p.date >= todayStr;

                  if (f === 'credited') return p.status === 'credited';
                  if (f === 'pending') return isPending;
                  if (f === 'overdue') return isOverdue;
                  if (f === 'holiday') return isHoliday;
                  return true;
                }).length;

                return (
                  <button
                    key={f}
                    type="button"
                    className={`filter-btn ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    <span style={{ textTransform: 'capitalize' }}>{f}</span> ({count})
                  </button>
                );
              })}
            </div>

            <div className="search-input-wrapper">
              <input
                type="text"
                className="table-search"
                placeholder="Search date or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="payouts-table-wrapper">
          <table className="payouts-table">
            <thead>
              <tr>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th>Expected Amount</th>
                <th>Actual Paid Date</th>
                <th>Received Amount</th>
                <th>Days Late</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No payouts match the filter.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((p) => {
                  const isHoliday = plan.holidays?.includes(p.date) || false;
                  const rowEditState = editStates[p.date] || {};
                  
                  const creditDateVal = rowEditState.creditedDate !== undefined 
                    ? rowEditState.creditedDate 
                    : (p.creditedDate || p.date);
                    
                  const receivedAmtVal = rowEditState.receivedAmount !== undefined
                    ? rowEditState.receivedAmount
                    : (p.receivedAmount !== undefined ? String(p.receivedAmount) : String(p.amount));

                  const isPartial = p.status === 'credited' && p.receivedAmount !== undefined && p.receivedAmount !== p.amount;

                  return (
                    <tr key={p.id} className={isHoliday ? 'row-holiday' : ''}>
                      <td style={{ fontWeight: 500 }}>
                        {formatWeekdayDate(p.date)}
                      </td>
                      <td>
                        <select
                          className="payout-status-select"
                          value={isHoliday ? 'holiday' : p.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as 'credited' | 'uncredited' | 'holiday';
                            handleUpdatePayout(p.date, { status: newStatus });
                          }}
                        >
                          <option value="uncredited">⏳ Pending / Uncredited</option>
                          <option value="credited">✅ Credited</option>
                          <option value="holiday">🏖️ Holiday</option>
                        </select>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        ₹{p.amount.toLocaleString('en-IN')}
                        {p.amount !== p.originalAmount && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                            Orig: ₹{p.originalAmount.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td>
                        {p.status === 'credited' && !isHoliday ? (
                          <input
                            type="date"
                            className="payout-date-input"
                            value={creditDateVal}
                            onChange={(e) => {
                              setEditStates((prev) => ({
                                ...prev,
                                [p.date]: {
                                  ...prev[p.date],
                                  creditedDate: e.target.value,
                                },
                              }));
                            }}
                            onBlur={() => saveRow(p.date)}
                            onKeyDown={(e) => handleKeyDown(e, p.date)}
                          />
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        {p.status === 'credited' && !isHoliday ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>₹</span>
                            <input
                              type="number"
                              className="payout-amount-input"
                              value={receivedAmtVal}
                              onChange={(e) => {
                                setEditStates((prev) => ({
                                  ...prev,
                                  [p.date]: {
                                    ...prev[p.date],
                                    receivedAmount: e.target.value,
                                  },
                                }));
                              }}
                              onBlur={() => saveRow(p.date)}
                              onKeyDown={(e) => handleKeyDown(e, p.date)}
                              placeholder={String(p.amount)}
                            />
                            {isPartial && (
                              <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255, 159, 10, 0.1)', color: 'var(--color-warning)', border: '1px solid rgba(255, 159, 10, 0.2)', marginLeft: '4px', textTransform: 'capitalize' }}>
                                Partial
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        {getDaysLateBadge(p)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Payout / Holiday Management Popover */}
      {selectedDate && (
        <div className="payout-popover-backdrop" onClick={() => setSelectedDate(null)}>
          <div
            className="payout-popover glass-panel animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="popover-title">
              {payoutsByExpectedDate[selectedDate] ? 'Manage Payout' : 'Manage Day'}
            </h4>
            <div className="popover-detail">
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Expected Scheduled Date: {new Date(selectedDate).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              {payoutsByExpectedDate[selectedDate] ? (
                <>
                  <p>Scheduled Payout: ₹{payoutsByExpectedDate[selectedDate].originalAmount.toLocaleString('en-IN')}</p>
                  {payoutsByExpectedDate[selectedDate].amount !== payoutsByExpectedDate[selectedDate].originalAmount && (
                    <p>Corrected Payout: ₹{payoutsByExpectedDate[selectedDate].amount.toLocaleString('en-IN')}</p>
                  )}
                  <p style={{ marginTop: '4px' }}>Status: <span style={{ textTransform: 'capitalize', fontWeight: 600, color: payoutsByExpectedDate[selectedDate].status === 'credited' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {payoutsByExpectedDate[selectedDate].status}
                  </span></p>

                  {payoutsByExpectedDate[selectedDate].status === 'credited' && delayInfo && (
                    <>
                      <p style={{ marginTop: '4px' }}>Actual Credited Date: <strong>{payoutsByExpectedDate[selectedDate].creditedDate}</strong></p>
                      <div className={`delay-badge ${delayInfo.isLate ? 'late' : delayInfo.isEarly ? 'early' : 'ontime'}`}>
                        {delayInfo.isLate ? `⏱️ Received Late (Delayed by ${delayInfo.delayDays} days)` : delayInfo.isEarly ? `🚀 Received Early (by ${Math.abs(delayInfo.delayDays)} days)` : `✅ Received on time`}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Non-payout day in plan duration.
                </p>
              )}
              {plan.holidays?.includes(selectedDate) && (
                <p style={{ color: 'var(--accent-purple)', fontWeight: 600, marginTop: '8px' }}>
                  🏖️ Marked as Market Holiday
                </p>
              )}
            </div>

            {payoutsByExpectedDate[selectedDate] && !plan.holidays?.includes(selectedDate) && (
              <div className="credit-form">
                <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {payoutsByExpectedDate[selectedDate].status === 'credited' ? 'Adjust Credit Details' : 'Mark Payout as Credited'}
                </h5>
                
                {payoutsByExpectedDate[selectedDate].status === 'uncredited' && (
                  <button
                    type="button"
                    className="glass-button success"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '0.85rem',
                      justifyContent: 'center',
                      background: 'rgba(0, 230, 118, 0.1)',
                      border: '1px solid rgba(0, 230, 118, 0.3)',
                      color: '#00e676',
                      fontWeight: 'bold',
                      marginBottom: '12px'
                    }}
                    onClick={() => {
                      const payout = payoutsByExpectedDate[selectedDate];
                      if (!payout) return;
                      const updatedPayouts = plan.payouts.map((p) => {
                        if (p.date === selectedDate) {
                          return {
                            ...p,
                            status: 'credited' as const,
                            creditedDate: getLocalDateString(),
                            receivedAmount: p.amount,
                          };
                        }
                        return p;
                      });
                      const updatedPlan = {
                        ...plan,
                        payouts: updatedPayouts,
                      };
                      onUpdatePlan(recalculatePayouts(updatedPlan));
                      setSelectedDate(null);
                    }}
                  >
                    ✅ Mark Credited Today (₹{payoutsByExpectedDate[selectedDate].amount.toLocaleString('en-IN')})
                  </button>
                )}
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Credit Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={actualCreditDate}
                    onChange={(e) => setActualCreditDate(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Amount Received (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Received Value"
                    value={actualReceivedAmount}
                    onChange={(e) => setActualReceivedAmount(e.target.value ? Number(e.target.value) : '')}
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="glass-button primary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', justifyContent: 'center' }}
                    onClick={handleSaveCreditDetails}
                  >
                    {payoutsByExpectedDate[selectedDate].status === 'credited' ? 'Save Adjustments' : 'Confirm Credit'}
                  </button>
                  
                  {payoutsByExpectedDate[selectedDate].status === 'credited' && (
                    <button
                      type="button"
                      className="glass-button danger"
                      style={{ padding: '8px 12px', fontSize: '0.85rem', justifyContent: 'center' }}
                      onClick={handleMarkAsUncredited}
                    >
                      Reset to Uncredited
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', borderTop: payoutsByExpectedDate[selectedDate] && !plan.holidays?.includes(selectedDate) ? '1px solid var(--border-color)' : 'none', paddingTop: payoutsByExpectedDate[selectedDate] && !plan.holidays?.includes(selectedDate) ? '16px' : '0' }}>
              <button
                type="button"
                className={`glass-button ${plan.holidays?.includes(selectedDate) ? 'primary' : 'danger'}`}
                style={{ justifyContent: 'center' }}
                onClick={handleToggleHoliday}
              >
                {plan.holidays?.includes(selectedDate) ? '🏖️ Remove Holiday' : '🏖️ Mark as Holiday'}
              </button>

              <button
                type="button"
                className="glass-button"
                style={{ justifyContent: 'center', marginTop: '6px' }}
                onClick={() => setSelectedDate(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
