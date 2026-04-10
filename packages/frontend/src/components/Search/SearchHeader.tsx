import React, { useState } from 'react';
import GlobalSearchBar from './GlobalSearchBar';
import AdvancedFilters from './AdvancedFilters';
import { motion } from 'framer-motion';

interface SavedFilter {
  name: string;
  filters: any;
}

export default function SearchHeader() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  const handleSaveFilter = (name: string, filters: any) => {
    setSavedFilters([...savedFilters, { name, filters }]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-4 border-b border-[#2D2D2D] bg-[#111111] sticky top-0 z-40"
    >
      <div className="flex-1">
        <GlobalSearchBar
          onSearch={(query) => console.log('Search:', query)}
          onSelectResult={(result) => console.log('Selected:', result)}
        />
      </div>
      <AdvancedFilters
        onFilterChange={(filters) => console.log('Filters:', filters)}
        onSaveFilter={handleSaveFilter}
        savedFilters={savedFilters}
      />
    </motion.div>
  );
}
