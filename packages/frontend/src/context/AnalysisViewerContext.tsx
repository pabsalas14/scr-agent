/**
 * Analysis Viewer Context
 * Global context to open analysis progress viewer from anywhere in the app
 *
 * Usage:
 * const { openAnalysisViewer } = useAnalysisViewer();
 * openAnalysisViewer(analysisId, projectId);
 */

import React, { createContext, useContext, useState } from 'react';
import AnalysisProgressViewer from '../components/Analysis/AnalysisProgressViewer';

interface ViewerState {
  isOpen: boolean;
  analysisId: string | null;
  projectId: string | null;
}

interface AnalysisViewerContextType {
  openAnalysisViewer: (analysisId: string, projectId: string) => void;
  closeAnalysisViewer: () => void;
}

const AnalysisViewerContext = createContext<AnalysisViewerContextType | undefined>(undefined);

export function AnalysisViewerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ViewerState>({
    isOpen: false,
    analysisId: null,
    projectId: null,
  });

  const openAnalysisViewer = (analysisId: string, projectId: string) => {
    setState({
      isOpen: true,
      analysisId,
      projectId,
    });
  };

  const closeAnalysisViewer = () => {
    setState({
      isOpen: false,
      analysisId: null,
      projectId: null,
    });
  };

  return (
    <AnalysisViewerContext.Provider
      value={{
        openAnalysisViewer,
        closeAnalysisViewer,
      }}
    >
      {children}
      {state.isOpen && state.analysisId && state.projectId && (
        <AnalysisProgressViewer
          analysisId={state.analysisId}
          projectId={state.projectId}
          onClose={closeAnalysisViewer}
        />
      )}
    </AnalysisViewerContext.Provider>
  );
}

export function useAnalysisViewer() {
  const context = useContext(AnalysisViewerContext);
  if (!context) {
    throw new Error('useAnalysisViewer must be used within AnalysisViewerProvider');
  }
  return context;
}
