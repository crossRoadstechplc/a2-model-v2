/**
 * useHeartbeat – periodic POST /auth/heartbeat while authenticated and app visible.
 *
 * Starts when token exists and component is mounted (protected app visible).
 * Sends every 60s; pauses when document is hidden; stops on unmount or logout.
 * Fails quietly on transient errors; 401 clears auth (handled by store).
 *
 * @see API.md § 5. Heartbeat
 */

import { useEffect, useRef } from 'react';
import useAuthStore from '../store/useAuthStore';

const HEARTBEAT_INTERVAL_MS = 60_000;

export function useHeartbeat(intervalMs = HEARTBEAT_INTERVAL_MS) {
  const token = useAuthStore((s) => s.token);
  const heartbeat = useAuthStore((s) => s.heartbeat);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const startInterval = () => {
      heartbeat();
      intervalRef.current = setInterval(() => heartbeat(), intervalMs);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) stopInterval();
      else startInterval();
    };

    if (!document.hidden) startInterval();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopInterval();
    };
  }, [token, heartbeat, intervalMs]);
}
