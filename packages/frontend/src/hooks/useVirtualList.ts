import { useState, useCallback, useMemo } from 'react';

interface UseVirtualListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualListState {
  visibleStartIndex: number;
  visibleEndIndex: number;
  offsetY: number;
}

export function useVirtualList({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualListProps): VirtualListState & {
  visibleItems: any[];
  totalHeight: number;
  handleScroll: (scrollTop: number) => void;
} {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEndIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(
    () => items.slice(visibleStartIndex, visibleEndIndex),
    [items, visibleStartIndex, visibleEndIndex]
  );

  const offsetY = visibleStartIndex * itemHeight;

  const handleScroll = useCallback((scrollTop: number) => {
    setScrollTop(scrollTop);
  }, []);

  return {
    visibleStartIndex,
    visibleEndIndex,
    offsetY,
    visibleItems,
    totalHeight,
    handleScroll,
  };
}
