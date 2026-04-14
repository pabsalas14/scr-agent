import GlobalSearchBar from './GlobalSearchBar';
import NotificationBell from '../Notifications/NotificationBell';
import { motion } from 'framer-motion';

export default function SearchHeader() {

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center p-4 border-b border-[#2D2D2D] bg-[#111111] sticky top-0 z-40"
    >
      <div className="flex-1 flex justify-center">
        <GlobalSearchBar
          onSearch={(query) => console.log('Search:', query)}
          onSelectResult={(result) => console.log('Selected:', result)}
        />
      </div>
      <div className="ml-6">
        <NotificationBell />
      </div>
    </motion.div>
  );
}
