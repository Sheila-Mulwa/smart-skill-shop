import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExchangeRateState {
  rate: number;
  loading: boolean;
  error: string | null;
}

// Default fallback rate (~1 USD = 130 KES)
const FALLBACK_RATE = 0.0077;

export const useExchangeRate = () => {
  const [state, setState] = useState<ExchangeRateState>({
    rate: FALLBACK_RATE,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-exchange-rate');
        
        if (error) throw error;
        
        setState({
          rate: data.rate || FALLBACK_RATE,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error fetching exchange rate:', err);
        setState({
          rate: FALLBACK_RATE,
          loading: false,
          error: 'Failed to fetch exchange rate',
        });
      }
    };

    fetchRate();
  }, []);

  const convertToUsd = (kesAmount: number): number => {
    return kesAmount * state.rate;
  };

  return { ...state, convertToUsd };
};

// Utility function for one-off conversions with a given rate
export const convertKesToUsd = (kesAmount: number, rate: number): string => {
  return (kesAmount * rate).toFixed(2);
};
