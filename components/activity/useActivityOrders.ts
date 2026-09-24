// Hook tải danh sách hoạt động: load khi focus tab, pull-to-refresh, trộn đánh giá cục bộ
import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { ActivityOrder } from '@/constants/mockOrders';
import { fetchActivityOrders, type ActivitySource } from './activityApi';
import { useRatingsVersion, withLocalRating } from './ratingStore';

export function useActivityOrders() {
  const [orders, setOrders] = useState<ActivityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [source, setSource] = useState<ActivitySource>('api');
  const inFlight = useRef(false);
  const ratingsVersion = useRatingsVersion();

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetchActivityOrders();
      setOrders(res.orders);
      setSource(res.source);
      setError(res.error);
    } finally {
      inFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load('initial');
    }, [load])
  );

  const merged = useMemo(() => orders.map(withLocalRating), [orders, ratingsVersion]);

  return {
    orders: merged,
    loading,
    refreshing,
    error,
    source,
    refresh: () => load('refresh'),
  };
}
