export interface Payout {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // Payout amount (0 if holiday)
  originalAmount: number; // Stored payout amount to restore if holiday is removed
  status: 'credited' | 'uncredited';
  isHoliday: boolean;
  creditedDate?: string; // YYYY-MM-DD
  receivedAmount?: number; // Actual amount received in INR
}

export function generatePayouts(
  startDateStr: string,
  endDateStr: string,
  payoutType: 'daily' | 'weekly' | 'monthly',
  payoutAmount: number,
  dailySkipWeekends: boolean,
  weeklyPayoutDay?: number,
  monthlyPayoutDate?: number
): Payout[] {
  const payouts: Payout[] = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [];
  }

  const formatLocalDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  if (payoutType === 'daily') {
    let current = new Date(start);
    // Start strictly after the day of investment (start date)
    current.setDate(current.getDate() + 1);
    
    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (!(dailySkipWeekends && isWeekend)) {
        const dateStr = formatLocalDate(current);
        payouts.push({
          id: `${dateStr}-daily`,
          date: dateStr,
          amount: payoutAmount,
          originalAmount: payoutAmount,
          status: 'uncredited',
          isHoliday: false
        });
      }
      current.setDate(current.getDate() + 1);
    }
  } else if (payoutType === 'weekly') {
    const targetDay = weeklyPayoutDay !== undefined ? weeklyPayoutDay : start.getDay();
    let current = new Date(start);
    // Start strictly after the day of investment
    current.setDate(current.getDate() + 1);
    
    // Find the first occurrence of the selected weekday after the start date
    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }
    
    while (current <= end) {
      const dateStr = formatLocalDate(current);
      payouts.push({
        id: `${dateStr}-weekly`,
        date: dateStr,
        amount: payoutAmount,
        originalAmount: payoutAmount,
        status: 'uncredited',
        isHoliday: false
      });
      current.setDate(current.getDate() + 7);
    }
  } else if (payoutType === 'monthly') {
    const targetDateNum = monthlyPayoutDate !== undefined ? monthlyPayoutDate : start.getDate();
    let monthOffset = 0;
    
    // If the target day of start month is on or before the start date, the first payout in that month would be <= start, so we must start from the next month.
    if (start.getDate() >= targetDateNum) {
      monthOffset = 1;
    }
    
    while (true) {
      const expectedYear = start.getFullYear() + Math.floor((start.getMonth() + monthOffset) / 12);
      const expectedMonth = ((start.getMonth() + monthOffset) % 12 + 12) % 12;
      
      // Create a date for the target day of the next month
      const nextDate = new Date(expectedYear, expectedMonth, targetDateNum);
      
      // Handle cases where the target month has fewer days than targetDateNum (e.g. Feb 30th)
      // If the day got shifted to the next month, pull it back to the last day of the expected month
      if (nextDate.getMonth() !== expectedMonth) {
        nextDate.setDate(0); // Set to last day of expected month
      }
      
      if (nextDate > end) {
        break;
      }
      
      if (nextDate > start) {
        const dateStr = formatLocalDate(nextDate);
        payouts.push({
          id: `${dateStr}-monthly`,
          date: dateStr,
          amount: payoutAmount,
          originalAmount: payoutAmount,
          status: 'uncredited',
          isHoliday: false
        });
      }
      
      monthOffset++;
    }
  }

  return payouts;
}

// Utility to calculate end date based on duration
export function calculateEndDate(
  startDateStr: string,
  durationValue: number,
  durationUnit: 'days' | 'weeks' | 'months'
): string {
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return '';

  const end = new Date(start);
  if (durationUnit === 'days') {
    // Add (durationValue - 1) days to include the start date in the duration
    // For example, Start: May 1st, Duration: 10 days -> End: May 10th
    end.setDate(start.getDate() + durationValue - 1);
  } else if (durationUnit === 'weeks') {
    // Add weeks * 7 days. If we start on May 1st for 1 week, we end on May 7th
    end.setDate(start.getDate() + (durationValue * 7) - 1);
  } else if (durationUnit === 'months') {
    // Add months. If we start on May 15th for 2 months, we end on July 14th
    end.setMonth(start.getMonth() + durationValue);
    end.setDate(start.getDate() - 1); // Subtract 1 day to be inclusive of start date
  }

  const yyyy = end.getFullYear();
  const mm = String(end.getMonth() + 1).padStart(2, '0');
  const dd = String(end.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function recalculatePayouts(plan: any): any {
  const holidays = plan.holidays || [];
  const dailySkipWeekends = plan.dailySkipWeekends || false;

  const isWeekend = (dateStr: string): boolean => {
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6;
  };

  const isWorkingDay = (dateStr: string): boolean => {
    if (plan.payoutType === 'weekly') {
      return !isWeekend(dateStr);
    }
    return !(dailySkipWeekends && isWeekend(dateStr));
  };

  const updatedPayouts = plan.payouts.map((p: Payout) => {
    // If this specific date is a holiday, its payout is 0
    if (holidays.includes(p.date)) {
      return {
        ...p,
        isHoliday: true,
        amount: 0,
      };
    }

    if (plan.payoutType === 'daily') {
      return {
        ...p,
        isHoliday: false,
        amount: p.originalAmount,
      };
    }

    if (plan.payoutType === 'weekly') {
      // Find the 7 days window ending on p.date: [p.date - 6, p.date]
      const endDate = new Date(p.date);
      let workingDays = 0;
      let holidayDays = 0;

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(endDate);
        currentDate.setDate(endDate.getDate() - i);
        
        // Format local date
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        // We only care about dates within the plan's range
        if (dateStr >= plan.startDate && dateStr <= plan.endDate) {
          const isWork = isWorkingDay(dateStr);
          if (isWork) {
            workingDays++;
            if (holidays.includes(dateStr)) {
              holidayDays++;
            }
          }
        }
      }

      // Calculate amount: subtract holiday days from working days
      const amount = workingDays > 0 
        ? Math.max(0, p.originalAmount - (p.originalAmount / workingDays) * holidayDays)
        : p.originalAmount;

      return {
        ...p,
        isHoliday: false,
        amount: Math.round(amount * 100) / 100, // round to 2 decimal places
      };
    }

    if (plan.payoutType === 'monthly') {
      // Find the monthly window leading up to p.date.
      const endDate = new Date(p.date);
      let workingDays = 0;
      let holidayDays = 0;
      
      const current = new Date(endDate);

      // Loop for 31 days or until we hit start date, counting working days
      for (let i = 0; i < 31; i++) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        if (dateStr >= plan.startDate) {
          const isWork = isWorkingDay(dateStr);
          if (isWork) {
            workingDays++;
            if (holidays.includes(dateStr)) {
              holidayDays++;
            }
          }
        } else {
          break;
        }
        current.setDate(current.getDate() - 1);
      }

      const amount = workingDays > 0
        ? Math.max(0, p.originalAmount - (p.originalAmount / workingDays) * holidayDays)
        : p.originalAmount;

      return {
        ...p,
        isHoliday: false,
        amount: Math.round(amount * 100) / 100,
      };
    }

    return p;
  });

  return {
    ...plan,
    payouts: updatedPayouts,
  };
}
