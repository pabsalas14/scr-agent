import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  canGoNext = true,
  canGoPrev = true,
  className = '',
}: PaginationProps) {
  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        onClick={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev || isLoading || currentPage === 1}
        className="p-2 rounded-lg hover:bg-[#2D2D2D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[#A0A0A0] hover:text-white"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pageNumbers.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-[#6B7280]">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            disabled={isLoading}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-[#F97316] text-white'
                : 'bg-[#242424] text-[#A0A0A0] hover:bg-[#2D2D2D] hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext || isLoading || currentPage === totalPages}
        className="p-2 rounded-lg hover:bg-[#2D2D2D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[#A0A0A0] hover:text-white"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <span className="ml-4 text-sm text-[#6B7280]">
        Página {currentPage} de {totalPages}
      </span>
    </div>
  );
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingsCount: number = 1
): (number | string)[] {
  const pages: (number | string)[] = [];
  const leftSiblingIndex = Math.max(currentPage - siblingsCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingsCount, totalPages);

  // Always show first page
  pages.push(1);

  // Add left ellipsis if needed
  if (leftSiblingIndex > 2) {
    pages.push('...');
  }

  // Add left siblings
  for (let i = leftSiblingIndex; i < currentPage; i++) {
    pages.push(i);
  }

  // Add current page
  pages.push(currentPage);

  // Add right siblings
  for (let i = currentPage + 1; i <= rightSiblingIndex; i++) {
    pages.push(i);
  }

  // Add right ellipsis if needed
  if (rightSiblingIndex < totalPages - 1) {
    pages.push('...');
  }

  // Always show last page if totalPages > 1
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}
