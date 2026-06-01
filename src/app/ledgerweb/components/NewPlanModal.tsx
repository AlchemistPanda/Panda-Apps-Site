'use client';

import React, { useState, useEffect } from 'react';
import { InvestmentPlan } from '../services/db';
import { generatePayouts, calculateEndDate, recalculatePayouts } from '../utils/payoutGenerator';

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: InvestmentPlan) => void;
  planToEdit?: InvestmentPlan;
}

export const NewPlanModal: React.FC<NewPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  planToEdit,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [payoutType, setPayoutType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dailySkipWeekends, setDailySkipWeekends] = useState(false);
  const [weeklyPayoutDay, setWeeklyPayoutDay] = useState<number>(1);
  const [monthlyPayoutDate, setMonthlyPayoutDate] = useState<number>(1);
  const [includeLastPayoutAfterEndDate, setIncludeLastPayoutAfterEndDate] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  // Duration settings
  const [endMethod, setEndMethod] = useState<'duration' | 'date'>('duration');
  const [durationValue, setDurationValue] = useState<number | ''>(2);
  const [durationUnit, setDurationUnit] = useState<'days' | 'weeks' | 'months'>('months');
  const [endDate, setEndDate] = useState('');
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');

  // Sync state with planToEdit when open
  useEffect(() => {
    if (isOpen) {
      if (planToEdit) {
        setName(planToEdit.name);
        setAmount(planToEdit.amount);
        setPayoutType(planToEdit.payoutType);
        setDailySkipWeekends(planToEdit.dailySkipWeekends || false);
        setWeeklyPayoutDay(planToEdit.weeklyPayoutDay !== undefined ? planToEdit.weeklyPayoutDay : 1);
        setMonthlyPayoutDate(planToEdit.monthlyPayoutDate !== undefined ? planToEdit.monthlyPayoutDate : 1);
        setIncludeLastPayoutAfterEndDate(planToEdit.includeLastPayoutAfterEndDate || false);
        setStartDate(planToEdit.startDate);
        setEndDate(planToEdit.endDate);
        setEndMethod('date');
        setPayoutAmount(planToEdit.payoutAmount);
      } else {
        setName('');
        setAmount('');
        setPayoutType('daily');
        setDailySkipWeekends(false);
        setIncludeLastPayoutAfterEndDate(false);
        const today = new Date();
        setStartDate(today.toISOString().split('T')[0]);
        setEndMethod('duration');
        setDurationValue(2);
        setDurationUnit('months');
        setPayoutAmount('');
        setWeeklyPayoutDay(today.getDay());
        setMonthlyPayoutDate(today.getDate());
      }
    }
  }, [planToEdit, isOpen]);

  // Auto-calculate end date when startDate, durationValue, or durationUnit changes
  useEffect(() => {
    if (endMethod === 'duration' && startDate && durationValue) {
      const calculated = calculateEndDate(startDate, Number(durationValue), durationUnit);
      setEndDate(calculated);
    }
  }, [startDate, durationValue, durationUnit, endMethod]);

  // Adjust defaults when startDate changes in Creation mode
  useEffect(() => {
    if (startDate && !planToEdit && isOpen) {
      const startObj = new Date(startDate);
      if (!isNaN(startObj.getTime())) {
        setWeeklyPayoutDay(startObj.getDay());
        setMonthlyPayoutDate(startObj.getDate());
      }
    }
  }, [startDate, planToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !startDate || !endDate || !payoutAmount) return;

    // Generate payouts list
    const payouts = generatePayouts(
      startDate,
      endDate,
      payoutType,
      Number(payoutAmount),
      payoutType === 'daily' ? dailySkipWeekends : false,
      payoutType === 'weekly' ? weeklyPayoutDay : undefined,
      payoutType === 'monthly' ? monthlyPayoutDate : undefined,
      payoutType !== 'daily' ? includeLastPayoutAfterEndDate : false
    );

    // Merge status from old payouts if editing
    const mergedPayouts = planToEdit
      ? payouts.map((np) => {
          const oldPayout = planToEdit.payouts.find((op) => op.date === np.date);
          if (oldPayout) {
            return {
              ...np,
              status: oldPayout.status,
              isHoliday: oldPayout.isHoliday,
              amount: oldPayout.isHoliday ? 0 : np.amount,
              // Preserve late-payout tracking data
              creditedDate: oldPayout.creditedDate,
              receivedAmount: oldPayout.receivedAmount,
            };
          }
          return np;
        })
      : payouts;

    const savedPlan: InvestmentPlan = {
      id: planToEdit ? planToEdit.id : `plan-${Date.now()}`,
      name,
      amount: Number(amount),
      payoutType,
      dailySkipWeekends: payoutType === 'daily' ? dailySkipWeekends : false,
      weeklyPayoutDay: payoutType === 'weekly' ? weeklyPayoutDay : undefined,
      monthlyPayoutDate: payoutType === 'monthly' ? monthlyPayoutDate : undefined,
      includeLastPayoutAfterEndDate: payoutType !== 'daily' ? includeLastPayoutAfterEndDate : false,
      startDate,
      endDate,
      payoutAmount: Number(payoutAmount),
      payouts: mergedPayouts,
      holidays: planToEdit ? (planToEdit.holidays || []) : [],
      createdAt: planToEdit ? planToEdit.createdAt : new Date().toISOString(),
    };

    onSave(recalculatePayouts(savedPlan));
    
    // Reset state
    setName('');
    setAmount('');
    setPayoutType('daily');
    setDailySkipWeekends(false);
    setIncludeLastPayoutAfterEndDate(false);
    setPayoutAmount('');
    onClose();
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <dialog open className="glass-panel animate-scale-up" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: '520px',
      padding: '32px',
      border: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 1000,
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '24px', fontSize: '1.5rem' }}>
        {planToEdit ? '✏️ Edit Investment Plan' : '📈 Create Investment Plan'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Plan Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Short-Term Equity Fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Investment Amount (₹)</label>
            <input
              type="number"
              className="form-input"
              placeholder="Capital in INR"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expected Payout (₹)</label>
            <input
              type="number"
              className="form-input"
              placeholder="Payout per interval"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value ? Number(e.target.value) : '')}
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Payout Frequency</label>
          <select
            className="form-select"
            value={payoutType}
            onChange={(e) => setPayoutType(e.target.value as any)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {payoutType === 'daily' && (
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="switch-group">
              <input
                type="checkbox"
                className="switch-checkbox"
                checked={dailySkipWeekends}
                onChange={(e) => setDailySkipWeekends(e.target.checked)}
              />
              <span className="switch-control" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Skip Weekends (Saturday & Sunday)
              </span>
            </label>
          </div>
        )}

        {payoutType === 'weekly' && (
          <div className="form-group">
            <label className="form-label">Weekly Payout Day</label>
            <select
              className="form-select"
              value={weeklyPayoutDay}
              onChange={(e) => setWeeklyPayoutDay(Number(e.target.value))}
            >
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
              <option value={0}>Sunday</option>
            </select>
          </div>
        )}

        {payoutType === 'monthly' && (
          <div className="form-group">
            <label className="form-label">Monthly Payout Date</label>
            <select
              className="form-select"
              value={monthlyPayoutDate}
              onChange={(e) => setMonthlyPayoutDate(Number(e.target.value))}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}{day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'} of month
                </option>
              ))}
            </select>
          </div>
        )}

        {payoutType !== 'daily' && (
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="switch-group">
              <input
                type="checkbox"
                className="switch-checkbox"
                checked={includeLastPayoutAfterEndDate}
                onChange={(e) => setIncludeLastPayoutAfterEndDate(e.target.checked)}
              />
              <span className="switch-control" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Include last payout if it falls past the end date
              </span>
            </label>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date Definition</label>
            <select
              className="form-select"
              value={endMethod}
              onChange={(e) => setEndMethod(e.target.value as any)}
            >
              <option value="duration">Specify Duration</option>
              <option value="date">Specify End Date</option>
            </select>
          </div>
        </div>

        {endMethod === 'duration' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input
                type="number"
                className="form-input"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value ? Number(e.target.value) : '')}
                min="1"
                required={endMethod === 'duration'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select
                className="form-select"
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as any)}
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required={endMethod === 'date'}
            />
          </div>
        )}

        {endMethod === 'duration' && endDate && (
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--accent-purple)',
            marginBottom: '24px',
            marginTop: '-8px',
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>Calculated End Date:</span>
            <span>{formatDateString(endDate)}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            type="button"
            className="glass-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="glass-button primary"
          >
            {planToEdit ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </form>
    </dialog>
  );
};
