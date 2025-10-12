'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';

export const useInvestments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadInvestments = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('useInvestments: API call timed out after 6 seconds');
      }, 6000);
      
      const response = await fetch(`/api/investments?userId=${user.id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        setInvestments(data.data);
      } else {
        setError(data.error || 'Failed to load investments');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('useInvestments: API call aborted due to timeout');
        setError('Request timed out');
      } else {
        console.error('useInvestments Error:', err);
        setError('Failed to load investments');
      }
      // Set fallback data to prevent empty state
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createInvestment = useCallback(async (planId, amount) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planId,
          investedAmount: amount
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadInvestments(); // Refresh investments
        return { success: true, data: data.data };
      } else {
        setError(data.error || 'Failed to create investment');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Error creating investment:', err);
      setError('Failed to create investment');
      return { success: false, error: 'Failed to create investment' };
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadInvestments]);

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  return {
    investments,
    loading,
    error,
    loadInvestments,
    createInvestment
  };
};

export const useInvestmentPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/investment-plans');
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.data);
      } else {
        setError(data.error || 'Failed to load investment plans');
      }
    } catch (err) {
      console.error('Error loading plans:', err);
      setError('Failed to load investment plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return {
    plans,
    loading,
    error,
    loadPlans
  };
};
