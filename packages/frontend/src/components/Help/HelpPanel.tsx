import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ChevronDown, ExternalLink } from 'lucide-react';

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  relatedTopics?: string[];
  externalLink?: string;
}

interface HelpPanelProps {
  topics: HelpTopic[];
  currentTopic?: string;
  onTopicSelect?: (topicId: string) => void;
  className?: string;
}

export function HelpPanel({
  topics,
  currentTopic,
  onTopicSelect,
  className = '',
}: HelpPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const selected = topics.find((t) => t.id === currentTopic) || topics[0];

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-[#242424] border border-[#2D2D2D] hover:bg-[#2D2D2D] text-[#A0A0A0] hover:text-[#F97316] transition-colors"
        title="Abrir panel de ayuda"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-12 right-0 z-50 w-96 max-h-96 overflow-y-auto bg-[#242424] border border-[#2D2D2D] rounded-lg shadow-lg"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#242424] border-b border-[#2D2D2D] px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Centro de Ayuda</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#2D2D2D] rounded transition-colors text-[#A0A0A0] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Topics List */}
            <div className="p-4 space-y-3">
              {topics.map((topic) => (
                <div key={topic.id}>
                  <button
                    onClick={() => {
                      onTopicSelect?.(topic.id);
                      toggleTopic(topic.id);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors flex items-center justify-between ${
                      selected?.id === topic.id
                        ? 'bg-[#F97316] text-white'
                        : 'bg-[#1E1E20] text-[#A0A0A0] hover:text-white hover:bg-[#2D2D2D]'
                    }`}
                  >
                    <span>{topic.title}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedTopics.has(topic.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Topic Content */}
                  <AnimatePresence>
                    {expandedTopics.has(topic.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 px-3 py-2 bg-[#1E1E20] rounded text-xs text-[#A0A0A0] space-y-2 border border-[#2D2D2D]">
                          <p>{topic.content}</p>

                          {/* External Link */}
                          {topic.externalLink && (
                            <a
                              href={topic.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#F97316] hover:text-white transition-colors"
                            >
                              Más información
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {/* Related Topics */}
                          {topic.relatedTopics && topic.relatedTopics.length > 0 && (
                            <div className="pt-2 border-t border-[#2D2D2D]">
                              <p className="text-[#6B7280] font-semibold mb-1">Temas relacionados:</p>
                              <div className="space-y-1">
                                {topic.relatedTopics.map((relatedId) => {
                                  const relatedTopic = topics.find((t) => t.id === relatedId);
                                  return relatedTopic ? (
                                    <button
                                      key={relatedId}
                                      onClick={() => {
                                        onTopicSelect?.(relatedId);
                                        toggleTopic(relatedId);
                                      }}
                                      className="block text-[#F97316] hover:text-white transition-colors text-left"
                                    >
                                      → {relatedTopic.title}
                                    </button>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
