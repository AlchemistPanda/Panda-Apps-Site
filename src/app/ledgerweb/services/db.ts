import { createClient } from '@supabase/supabase-js';
import { Payout } from '../utils/payoutGenerator';

export interface InvestmentPlan {
  id: string;
  name: string;
  amount: number; // Investment amount in INR
  payoutType: 'daily' | 'weekly' | 'monthly';
  dailySkipWeekends: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  payoutAmount: number; // Regular payout amount
  payouts: Payout[];
  createdAt: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const PLANS_KEY = 'pandathings_investment_plans';

export const db = {
  isConfigured(): boolean {
    return !!supabase;
  },

  async getPlans(): Promise<InvestmentPlan[]> {
    if (!supabase) {
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

    const { data, error } = await supabase
      .from('investment_plans')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching plans from Supabase:', error);
      throw error;
    }

    return (data || []) as unknown as InvestmentPlan[];
  },

  async savePlan(plan: InvestmentPlan): Promise<void> {
    if (!supabase) {
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

    const { error } = await supabase
      .from('investment_plans')
      .upsert({
        id: plan.id,
        name: plan.name,
        amount: plan.amount,
        payoutType: plan.payoutType,
        dailySkipWeekends: plan.dailySkipWeekends,
        startDate: plan.startDate,
        endDate: plan.endDate,
        payoutAmount: plan.payoutAmount,
        payouts: plan.payouts,
        createdAt: plan.createdAt
      });

    if (error) {
      console.error('Error upserting plan in Supabase:', error);
      throw error;
    }
  },

  async deletePlan(id: string): Promise<void> {
    if (!supabase) {
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

    const { error } = await supabase
      .from('investment_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting plan from Supabase:', error);
      throw error;
    }
  }
};
