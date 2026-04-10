import React, { useRef, useEffect } from 'react';
import { useVirtualList } from '../../hooks/useVirtualList';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight = 600,
  renderItem,
  className = '',
  overscan = 5,
  onScroll,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    visibleStartIndex,
    visibleEndIndex,
    offsetY,
    visibleItems,
    totalHeight,
    handleScroll,
  } = useVirtualList({
    items,
    itemHeight,
    containerHeight,
    overscan,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScrollEvent = (e: Event) => {
      const scrollTop = (e.target as HTMLDivElement).scrollTop;
      handleScroll(scrollTop);
      onScroll?.(scrollTop);
    };

    container.addEventListener('scroll', handleScrollEvent);
    return () => container.removeEventListener('scroll', handleScrollEvent);
  }, [handleScroll, onScroll]);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: `${containerHeight}px` }}
    >
      {/* Spacer before visible items */}
      <div style={{ height: `${offsetY}px` }} />

      {/* Visible items */}
      <div>
        {visibleItems.map((item, index) => (
          <div
            key={visibleStartIndex + index}
            style={{ height: `${itemHeight}px` }}
          >
            {renderItem(item, visibleStartIndex + index)}
          </div>
        ))}
      </div>

      {/* Spacer after visible items */}
      <div style={{ height: `${totalHeight - (offsetY + visibleItems.length * itemHeight)}px` }} />
    </div>
  );
}
