/**
 * useAccessLogs – fetches admin access logs.
 * Returns { logs, loading, error, refetch }.
 * Only call when user is admin and has token.
 */

import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/useAuthStore';
import { getAccessLogs } from '../lib/api/admin';

export function useAccessLogs(options = {}) {
  const token = useAuthStore((s) => s.token);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await getAccessLogs(token, options);
    setLoading(false);
    if (result.success) {
      setLogs(result.data ?? []);
    } else {
      setError(result.message ?? 'Failed to load access logs');
    }
  }, [token, options?.limit, options?.offset, options?.email, options?.activeOnly, options?.dateFrom, options?.dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}
