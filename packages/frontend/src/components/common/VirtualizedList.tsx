import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from 'lucide-react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  overscan?: number;
  className?: string;
}

export default function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  overscan = 5,
  className = '',
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    // Load more trigger: when scrolled to 80% of content
    if (onLoadMore && hasMore) {
      const scrollPercentage = (target.scrollTop + containerHeight) / (items.length * itemHeight);
      if (scrollPercentage > 0.8) {
        onLoadMore();
      }
    }
  }, [containerHeight, items.length, itemHeight, onLoadMore, hasMore]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto relative ${className}`}
      style={{ height: `${containerHeight}px` }}
    >
      {/* Virtual spacer - top */}
      <div style={{ height: `${offsetY}px` }} />

      {/* Visible items */}
      <div>
        {visibleItems.map((item, idx) => (
          <div key={startIndex + idx} style={{ height: `${itemHeight}px` }}>
            {renderItem(item, startIndex + idx)}
          </div>
        ))}
      </div>

      {/* Virtual spacer - bottom */}
      <div style={{ height: `${Math.max(0, (items.length - endIndex) * itemHeight)}px` }} />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <Loader className="w-5 h-5 text-[#F97316] animate-spin" />
        </div>
      )}
    </div>
  );
}
