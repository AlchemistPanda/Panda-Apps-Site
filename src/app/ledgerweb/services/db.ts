import { Payout } from '../utils/payoutGenerator';

export interface InvestmentPlan {
  id: string;
  name: string;
  amount: number; // Investment amount in INR
  payoutType: 'daily' | 'weekly' | 'monthly';
  dailySkipWeekends: boolean;
  weeklyPayoutDay?: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  monthlyPayoutDate?: number; // 1 to 31
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  payoutAmount: number; // Regular payout amount
  payouts: Payout[];
  holidays?: string[]; // Array of holiday dates in YYYY-MM-DD format
  createdAt: string;
}

const PLANS_KEY = 'pandathings_investment_plans';

let isConfiguredState = false;

export const db = {
  isConfigured(): boolean {
    return isConfiguredState;
  },

  async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const res = await fetch('/api/ledgerweb/config');
      const data = await res.json();
      isConfiguredState = !!data.configured;
      return isConfiguredState;
    } catch (e) {
      console.error('Failed to probe Upstash Redis config', e);
      isConfiguredState = false;
      return false;
    }
  },

  async getPlans(): Promise<InvestmentPlan[]> {
    if (!isConfiguredState) {
      // Demo Mode Fallback (LocalStorage)
      if (typeof window === 'undefined') return [];
      try {
        const data = localStorage.getItem(PLANS_KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.error('Error reading local plans', e);
        return [];
      }
    }

    try {
      const res = await fetch('/api/ledgerweb/plans');
      if (!res.ok) throw new Error('API fetch failed');
      return await res.json();
    } catch (error) {
      console.error('Error fetching plans from Redis API:', error);
      throw error;
    }
  },

  async savePlan(plan: InvestmentPlan): Promise<void> {
    if (!isConfiguredState) {
      // Demo Mode Fallback (LocalStorage)
      if (typeof window === 'undefined') return;
      try {
        const plans = await this.getPlans();
        const index = plans.findIndex((p) => p.id === plan.id);
        if (index >= 0) {
          plans[index] = plan;
        } else {
          plans.push(plan);
        }
        localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
      } catch (e) {
        console.error('Error saving local plan', e);
      }
      return;
    }

    try {
      const res = await fetch('/api/ledgerweb/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plan),
      });
      if (!res.ok) throw new Error('API save failed');
    } catch (error) {
      console.error('Error saving plan to Redis API:', error);
      throw error;
    }
  },

  async deletePlan(id: string): Promise<void> {
    if (!isConfiguredState) {
      // Demo Mode Fallback (LocalStorage)
      if (typeof window === 'undefined') return;
      try {
        const plans = await this.getPlans();
        const filtered = plans.filter((p) => p.id !== id);
        localStorage.setItem(PLANS_KEY, JSON.stringify(filtered));
      } catch (e) {
        console.error('Error deleting local plan', e);
      }
      return;
    }

    try {
      const res = await fetch(`/api/ledgerweb/plans/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('API delete failed');
    } catch (error) {
      console.error('Error deleting plan from Redis API:', error);
      throw error;
    }
  }
};
