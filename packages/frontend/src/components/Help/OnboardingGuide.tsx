import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  targetElement?: string;
  tips?: string[];
}

interface OnboardingGuideProps {
  steps: OnboardingStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
  className?: string;
}

export function OnboardingGuide({
  steps,
  onComplete,
  onSkip,
  autoStart = false,
  className = '',
}: OnboardingGuideProps) {
  // Return null if no steps provided
  if (!steps || steps.length === 0) {
    return null;
  }

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(autoStart);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentStep = steps[currentStepIndex] as OnboardingStep;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  }, [currentStepIndex, steps.length]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    onSkip?.();
  }, [onSkip]);

  const markStepComplete = useCallback(() => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep.id);
    setCompletedSteps(newCompleted);
  }, [completedSteps, currentStep.id]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ${className}`}
        >
          {/* Guide Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#242424] border border-[#2D2D2D] rounded-lg shadow-lg w-full max-w-md"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#2D2D2D] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{currentStep.title}</h2>
                <p className="text-xs text-[#6B7280] mt-1">
                  Paso {currentStepIndex + 1} de {steps.length}
                </p>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 hover:bg-[#2D2D2D] rounded transition-colors text-[#A0A0A0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-[#1E1E20]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-[#F97316] to-[#EA6B1B]"
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-4">
              <p className="text-sm text-[#A0A0A0]">{currentStep.description}</p>

              {/* Tips */}
              {currentStep.tips && currentStep.tips.length > 0 && (
                <div className="bg-[#1E1E20] border border-[#F97316]/20 rounded p-3 space-y-2">
                  <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">💡 Tips</p>
                  <ul className="space-y-1">
                    {currentStep.tips.map((tip, index) => (
                      <li key={index} className="text-xs text-[#A0A0A0] flex gap-2">
                        <span className="text-[#F97316]">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Button */}
              {currentStep.action && (
                <button
                  onClick={markStepComplete}
                  className="w-full px-4 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] transition-colors font-medium text-sm"
                >
                  {currentStep.action}
                </button>
              )}

              {/* Step Indicators */}
              <div className="flex gap-1 justify-center pt-2">
                {steps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStepIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStepIndex
                        ? 'bg-[#F97316] w-6'
                        : completedSteps.has(step.id)
                          ? 'bg-[#22C55E]'
                          : 'bg-[#2D2D2D]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#2D2D2D] flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="text-xs text-[#6B7280] hover:text-white transition-colors"
              >
                Omitir guía
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="px-4 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-[#A0A0A0] hover:text-white hover:bg-[#2D2D2D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Atrás
                </button>

                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  {currentStepIndex === steps.length - 1 ? (
                    <>
                      Completar
                      <Check className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
