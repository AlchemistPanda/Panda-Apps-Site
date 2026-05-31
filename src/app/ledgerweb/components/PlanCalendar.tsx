'use client';

import React, { useState, useEffect } from 'react';
import { InvestmentPlan } from '../services/db';
import { Payout, recalculatePayouts } from '../utils/payoutGenerator';

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

  const todayStr = new Date().toISOString().split('T')[0];

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

  // Create an index of payouts by date for quick lookup
  const payoutsByDate = plan.payouts.reduce((acc, p) => {
    acc[p.date] = p;
    return acc;
  }, {} as Record<string, Payout>);

  // Sync form state when a date is selected
  useEffect(() => {
    if (selectedDate) {
      const payout = payoutsByDate[selectedDate];
      if (payout) {
        setActualCreditDate(payout.creditedDate || new Date().toISOString().split('T')[0]);
        setActualReceivedAmount(payout.receivedAmount !== undefined ? payout.receivedAmount : payout.amount);
      } else {
        setActualCreditDate('');
        setActualReceivedAmount('');
      }
    }
  }, [selectedDate, plan.id]);

  const handleSaveCreditDetails = () => {
    if (!selectedDate) return;
    const payout = payoutsByDate[selectedDate];
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

    onUpdatePlan(updatedPlan);
    setSelectedDate(null);
  };

  const handleMarkAsUncredited = () => {
    if (!selectedDate) return;
    const payout = payoutsByDate[selectedDate];
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

    onUpdatePlan(updatedPlan);
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
      const payout = payoutsByDate[dateKey];
      const isToday = dateKey === todayStr;
      const inPlanRange = dateKey >= plan.startDate && dateKey <= plan.endDate;
      const isHoliday = plan.holidays?.includes(dateKey) || false;
      
      let cellClass = 'calendar-cell';
      let statusDot = null;
      let displayAmount = '';

      if (inPlanRange) {
        cellClass += ' is-range-day';
      }

      if (isHoliday) {
        cellClass += ' is-holiday';
        statusDot = <span className="status-dot holiday" title="Market Holiday">🏖️</span>;
      }

      if (payout) {
        cellClass += ' has-payout';
        
        // Display the actual received amount if credited, otherwise recalculated amount!
        const activeAmount = payout.status === 'credited' && payout.receivedAmount !== undefined
          ? payout.receivedAmount
          : payout.amount;

        if (activeAmount > 0) {
          displayAmount = `₹${activeAmount.toLocaleString('en-IN')}`;
        }
        
        if (!isHoliday) {
          if (payout.status === 'credited') {
            cellClass += ' is-credited';
            // Show a delay checkmark indicator if credited late!
            const isLate = payout.creditedDate && payout.creditedDate > payout.date;
            statusDot = (
              <span 
                className={`status-dot credited ${isLate ? 'late' : ''}`} 
                title={isLate ? `Credited Late (${payout.creditedDate})` : 'Credited'}
              >
                {isLate ? '⏱️' : '✓'}
              </span>
            );
          } else if (payout.date < todayStr) {
            cellClass += ' is-overdue';
            statusDot = <span className="status-dot overdue" title="Overdue Payout">⚠️</span>;
          } else {
            cellClass += ' is-pending';
            statusDot = <span className="status-dot pending" title="Pending Payout">⏳</span>;
          }
        }
      }

      if (isToday) {
        cellClass += ' is-today';
      }

      cells.push(
        <div
          key={`day-${day}`}
          className={cellClass}
          onClick={() => inPlanRange && setSelectedDate(dateKey)}
        >
          <span className="day-number">{day}</span>
          {payout && payout.amount > 0 && !isHoliday && (
            <div className="payout-indicator">
              <span className="payout-amount">{displayAmount}</span>
            </div>
          )}
          {statusDot && (
            <div className="status-dot-wrapper">
              {statusDot}
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
    const payout = payoutsByDate[selectedDate];
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
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          transition: all 0.2s ease;
          opacity: 0.4;
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
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        /* Status colors on cells */
        .calendar-cell.is-credited {
          border-left: 3px solid var(--color-success) !important;
        }
        .calendar-cell.is-pending {
          border-left: 3px solid var(--color-warning) !important;
        }
        .calendar-cell.is-overdue {
          border-left: 3px solid var(--color-error) !important;
          background: rgba(255, 59, 48, 0.02) !important;
        }
        .calendar-cell.is-holiday {
          border-left: 3px solid var(--accent-purple) !important;
          background: rgba(142, 84, 255, 0.04) !important;
        }

        .payout-indicator {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-top: 4px;
        }

        .status-dot-wrapper {
          position: absolute;
          bottom: 8px;
          right: 8px;
        }

        .payout-amount {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .status-dot {
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .status-dot.credited.late {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 4px;
          padding: 1px 3px;
          font-size: 0.65rem;
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

      {/* Interactive Payout / Holiday Management Popover */}
      {selectedDate && (
        <div className="payout-popover-backdrop" onClick={() => setSelectedDate(null)}>
          <div
            className="payout-popover glass-panel animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="popover-title">
              {payoutsByDate[selectedDate] ? 'Manage Payout' : 'Manage Day'}
            </h4>
            <div className="popover-detail">
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Date: {new Date(selectedDate).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              {payoutsByDate[selectedDate] ? (
                <>
                  <p>Scheduled Payout: ₹{payoutsByDate[selectedDate].originalAmount.toLocaleString('en-IN')}</p>
                  {payoutsByDate[selectedDate].amount !== payoutsByDate[selectedDate].originalAmount && (
                    <p>Corrected Payout: ₹{payoutsByDate[selectedDate].amount.toLocaleString('en-IN')}</p>
                  )}
                  <p style={{ marginTop: '4px' }}>Status: <span style={{ textTransform: 'capitalize', fontWeight: 600, color: payoutsByDate[selectedDate].status === 'credited' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {payoutsByDate[selectedDate].status}
                  </span></p>

                  {payoutsByDate[selectedDate].status === 'credited' && delayInfo && (
                    <div className={`delay-badge ${delayInfo.isLate ? 'late' : delayInfo.isEarly ? 'early' : 'ontime'}`}>
                      {delayInfo.isLate ? `⏱️ Received Late (Delayed by ${delayInfo.delayDays} days)` : delayInfo.isEarly ? `🚀 Received Early (by ${Math.abs(delayInfo.delayDays)} days)` : `✅ Received on time`}
                    </div>
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

            {payoutsByDate[selectedDate] && !plan.holidays?.includes(selectedDate) && (
              <div className="credit-form">
                <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {payoutsByDate[selectedDate].status === 'credited' ? 'Adjust Credit Details' : 'Mark Payout as Credited'}
                </h5>
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
                    {payoutsByDate[selectedDate].status === 'credited' ? 'Save Adjustments' : 'Confirm Credit'}
                  </button>
                  
                  {payoutsByDate[selectedDate].status === 'credited' && (
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', borderTop: payoutsByDate[selectedDate] && !plan.holidays?.includes(selectedDate) ? '1px solid var(--border-color)' : 'none', paddingTop: payoutsByDate[selectedDate] && !plan.holidays?.includes(selectedDate) ? '16px' : '0' }}>
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
