export interface Payout {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // Payout amount (0 if holiday)
  originalAmount: number; // Stored payout amount to restore if holiday is removed
  status: 'credited' | 'uncredited';
  isHoliday: boolean;
}

export function generatePayouts(
  startDateStr: string,
  endDateStr: string,
  payoutType: 'daily' | 'weekly' | 'monthly',
  payoutAmount: number,
  dailySkipWeekends: boolean
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

  let current = new Date(start);

  if (payoutType === 'daily') {
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
    const targetDay = start.getDate();
    let monthOffset = 0;
    
    while (true) {
      // Create a date for the target day of the next month
      const nextDate = new Date(start.getFullYear(), start.getMonth() + monthOffset, targetDay);
      
      // Handle cases where the target month has fewer days than targetDay (e.g. Feb 30th)
      const expectedYear = start.getFullYear() + Math.floor((start.getMonth() + monthOffset) / 12);
      const expectedMonth = ((start.getMonth() + monthOffset) % 12 + 12) % 12;
      
      // If the day got shifted to the next month, pull it back to the last day of the expected month
      if (nextDate.getMonth() !== expectedMonth) {
        nextDate.setDate(0); // Set to last day of previous month
      }
      
      if (nextDate > end) {
        break;
      }
      
      const dateStr = formatLocalDate(nextDate);
      payouts.push({
        id: `${dateStr}-monthly`,
        date: dateStr,
        amount: payoutAmount,
        originalAmount: payoutAmount,
        status: 'uncredited',
        isHoliday: false
      });
      
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
