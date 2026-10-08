// Hook "Hoạt động của tôi": đơn đang chạy (scope=active) + lịch sử (scope=history, phân trang 20/trang).
// Tải khi focus tab, kéo để làm mới, cuộn cuối danh sách để tải thêm; đơn đổi trạng thái (realtime) → tải lại.
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listOrders, type OrderListItem } from '@/services/orders';
import { ensureCatalog } from '@/services/catalog';
import { errorMessage } from '@/services/zuum';
import { useRealtime, useRealtimeRefetch } from '@/hooks/useRealtime';

const PAGE_SIZE = 20;

export function useActivityOrders() {
  const [active, setActive] = useState<OrderListItem[]>([]);
  const [history, setHistory] = useState<OrderListItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const inFlight = useRef(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'silent') => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (mode === 'refresh') setRefreshing(true);
    else if (mode === 'initial') setLoading(true);
    try {
      // catalog để biết nhóm dịch vụ (icon, chip lọc) — lỗi catalog không chặn danh sách
      await ensureCatalog().catch(() => null);
      const [a, h] = await Promise.all([listOrders('active', 1, 50), listOrders('history', 1, PAGE_SIZE)]);
      setActive(a.items);
      setHistory(h.items);
      setHistoryTotal(h.total);
      setPage(1);
      setError(undefined);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được danh sách chuyến đi'));
    } finally {
      inFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (inFlight.current || loadingMore || history.length >= historyTotal) return;
    setLoadingMore(true);
    try {
      const next = await listOrders('history', page + 1, PAGE_SIZE);
      setHistory((prev) => [...prev, ...next.items.filter((o) => !prev.some((p) => p.id === o.id))]);
      setHistoryTotal(next.total);
      setPage(next.page);
    } catch (e) {
      setError(errorMessage(e, 'Không tải thêm được lịch sử'));
    } finally {
      setLoadingMore(false);
    }
  }, [history.length, historyTotal, loadingMore, page]);

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  useRealtime('order.updated', () => void load('silent'));
  useRealtimeRefetch(() => void load('silent'));

  return {
    active,
    history,
    hasMore: history.length < historyTotal,
    loading,
    refreshing,
    loadingMore,
    error,
    refresh: () => load('refresh'),
    loadMore,
  };
}
