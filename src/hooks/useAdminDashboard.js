/**
 * useAdminDashboard – fetches admin summary + active sessions.
 * Returns { summary, activeSessions, loading, error, refetch }.
 * Aggregates (total users, logins, hours, active count) computed on frontend for display only.
 */

import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/useAuthStore';
import { getAccessSummary, getActiveSessions } from '../lib/api/admin';

export function useAdminDashboard() {
  const token = useAuthStore((s) => s.token);
  const [summary, setSummary] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    const [summaryRes, activeRes] = await Promise.all([
      getAccessSummary(token),
      getActiveSessions(token),
    ]);
    setLoading(false);

    if (!summaryRes.success) {
      setError(summaryRes.message ?? 'Failed to load summary');
      return;
    }
    if (!activeRes.success) {
      setError(activeRes.message ?? 'Failed to load active sessions');
      return;
    }

    setSummary(summaryRes.data ?? []);
    setActiveSessions(activeRes.data ?? []);
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    summary,
    activeSessions,
    loading,
    error,
    refetch: fetchAll,
  };
}
