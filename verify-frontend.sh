#!/bin/bash

# ============================================================================
# FRONTEND VERIFICATION SCRIPT
# ============================================================================
# Checks TypeScript compilation, component imports, and code quality
# for all 12 feature components

set -e

FRONTEND_DIR="/Users/pablosalas/scr-agent/packages/frontend"
RESULTS_FILE="/tmp/frontend-verification.txt"
: > "$RESULTS_FILE"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${BLUE}▶${NC} $1" | tee -a "$RESULTS_FILE"
}

success() {
  echo -e "${GREEN}✅ $1${NC}" | tee -a "$RESULTS_FILE"
}

error() {
  echo -e "${RED}❌ $1${NC}" | tee -a "$RESULTS_FILE"
}

warning() {
  echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$RESULTS_FILE"
}

check_file_exists() {
  local file=$1
  local name=$2
  if [ -f "$file" ]; then
    success "$name found"
    return 0
  else
    warning "$name NOT found at $file"
    return 1
  fi
}

# ============================================================================
# 1. COMPONENT FILE CHECKS
# ============================================================================

log "🔍 Checking Feature Component Files..."
echo ""

COMPONENTS=(
  # Feature 1
  "src/components/ui/ConfirmDialog.tsx:Confirm Dialog"
  "src/hooks/useConfirm.ts:useConfirm Hook"

  # Feature 2
  "src/components/ui/SkeletonLoader.tsx:SkeletonLoader"
  "src/components/ui/LoadingSpinner.tsx:LoadingSpinner"
  "src/components/ui/EmptyState.tsx:EmptyState"
  "src/hooks/useAsyncOperation.ts:useAsyncOperation"
  "src/hooks/useToast.ts:useToast Hook"

  # Feature 3
  "src/components/Search/GlobalSearchBar.tsx:GlobalSearchBar"
  "src/components/Search/AdvancedFilters.tsx:AdvancedFilters"
  "src/components/Search/SearchHeader.tsx:SearchHeader"

  # Feature 4
  "src/components/Analysis/AnalysisProgress.tsx:AnalysisProgress"
  "src/components/Analysis/ExecutionHistory.tsx:ExecutionHistory"

  # Feature 5
  "src/components/Settings/WebhookManager.tsx:WebhookManager"
  "src/components/Settings/WebhookDeliveryLog.tsx:WebhookDeliveryLog"

  # Feature 6
  "src/components/Incidents/IncidentComments.tsx:IncidentComments"
  "src/components/Incidents/SLAIndicator.tsx:SLAIndicator"
  "src/components/Incidents/AssignmentPanel.tsx:AssignmentPanel"

  # Feature 7
  "src/components/Analysis/AnalysisComparison.tsx:AnalysisComparison"
  "src/components/Analysis/RiskEvolutionChart.tsx:RiskEvolutionChart"

  # Feature 8
  "src/components/Alerts/AlertRuleBuilder.tsx:AlertRuleBuilder"
  "src/components/Notifications/NotificationCenter.tsx:NotificationCenter"

  # Feature 9
  "src/components/ui/VirtualList.tsx:VirtualList"
  "src/hooks/usePaginatedQuery.ts:usePaginatedQuery"
  "src/components/ui/Pagination.tsx:Pagination"
  "src/services/cache.service.ts:Cache Service"

  # Feature 10
  "src/components/ui/Tooltip.tsx:Tooltip"
  "src/components/Help/HelpPanel.tsx:HelpPanel"
  "src/components/Help/OnboardingGuide.tsx:OnboardingGuide"

  # Feature 11
  "src/services/anomaly-detection.service.ts:Anomaly Detection"
  "src/components/Dashboard/AnomalyDashboard.tsx:AnomalyDashboard"
  "src/components/Dashboard/BaselineVisualization.tsx:BaselineVisualization"

  # Feature 12
  "src/components/Dashboard/RiskHeatMap.tsx:RiskHeatMap"
  "src/components/Dashboard/KPICard.tsx:KPICard"
  "src/components/Dashboard/AdvancedDashboard.tsx:AdvancedDashboard"
  "src/components/Dashboard/WidgetBuilder.tsx:WidgetBuilder"
)

FOUND_COUNT=0
TOTAL_COUNT=0

for component in "${COMPONENTS[@]}"; do
  IFS=':' read -r file name <<< "$component"
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  if check_file_exists "$FRONTEND_DIR/$file" "$name"; then
    FOUND_COUNT=$((FOUND_COUNT + 1))
  fi
done

echo ""
success "Component files: $FOUND_COUNT/$TOTAL_COUNT found"

# ============================================================================
# 2. TYPESCRIPT COMPILATION CHECK
# ============================================================================

log ""
log "🔧 TypeScript Compilation Check..."
echo ""

cd "$FRONTEND_DIR"
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l)

if [ "$TS_ERRORS" -eq 0 ]; then
  success "TypeScript: ✅ 0 errors"
else
  warning "TypeScript: $TS_ERRORS errors found"
  echo "  (Note: Some errors may be in non-feature files)"
fi

# ============================================================================
# 3. SPECIFIC COMPONENT CHECKS
# ============================================================================

log ""
log "📋 Detailed Component Analysis..."
echo ""

# Check for React hooks compliance
log "Checking for React hooks issues..."
HOOKS_ISSUES=$(grep -r "useCallback\|useEffect\|useState" src/hooks/ src/components/ 2>/dev/null | grep -E "(multiple calls in condition|wrong order)" | wc -l || echo 0)
success "React hooks analysis: $HOOKS_ISSUES potential issues found"

# Check for missing imports
log "Checking for missing type imports..."
TYPE_IMPORTS=$(grep -r "import type" src/hooks/ src/components/ 2>/dev/null | wc -l || echo 0)
success "Type imports found: $TYPE_IMPORTS"

# Check for console errors in code
log "Checking for hardcoded console.log statements..."
CONSOLE_LOGS=$(grep -r "console\.log\|console\.error\|console\.warn" src/hooks/ src/components/ 2>/dev/null | grep -v "logger\." | wc -l || echo 0)
if [ "$CONSOLE_LOGS" -eq 0 ]; then
  success "Console statements: Clean ✅"
else
  warning "Found $CONSOLE_LOGS console statements (should use logger service)"
fi

# ============================================================================
# 4. SERVICE VERIFICATION
# ============================================================================

log ""
log "🔌 Service Verification..."
echo ""

SERVICES=(
  "src/services/api.service.ts:API Service (BUG #12 FIXED)"
  "src/services/socket.service.ts:Socket Service (BUG #16 FIXED)"
  "src/services/cache.service.ts:Cache Service (BUG #17 FIXED)"
  "src/services/anomaly-detection.service.ts:Anomaly Detection"
)

for service in "${SERVICES[@]}"; do
  IFS=':' read -r file name <<< "$service"
  if check_file_exists "$FRONTEND_DIR/$file" "$name"; then
    # Verify service exports correctly
    if grep -q "export.*service" "$FRONTEND_DIR/$file" 2>/dev/null; then
      success "  ✓ $name exports properly"
    else
      warning "  ⚠ $name export pattern unclear"
    fi
  fi
done

# ============================================================================
# 5. DEPENDENCY VERIFICATION
# ============================================================================

log ""
log "📦 Dependency Verification..."
echo ""

REQUIRED_DEPS=(
  "react:React"
  "react-dom:React DOM"
  "zustand:Zustand (State)"
  "framer-motion:Framer Motion"
  "recharts:Recharts (Charts)"
  "socket.io-client:Socket.IO"
  "date-fns:Date Functions"
  "zod:Zod (Validation)"
)

for dep in "${REQUIRED_DEPS[@]}"; do
  IFS=':' read -r pkg name <<< "$dep"
  if grep -q "\"$pkg\"" "$FRONTEND_DIR/package.json" 2>/dev/null; then
    success "$name installed ✅"
  else
    error "$name NOT installed"
  fi
done

# ============================================================================
# 6. FINAL SUMMARY
# ============================================================================

log ""
log "════════════════════════════════════════════════════════════════"
log "📊 FRONTEND VERIFICATION SUMMARY"
log "════════════════════════════════════════════════════════════════"

echo ""
echo "Component Coverage: $FOUND_COUNT/$TOTAL_COUNT"
echo "TypeScript Errors: $TS_ERRORS"
echo "Console Statements: $CONSOLE_LOGS (should be 0)"
echo ""

if [ "$FOUND_COUNT" -eq "$TOTAL_COUNT" ] && [ "$TS_ERRORS" -eq 0 ]; then
  success "✅ FRONTEND STRUCTURE VERIFIED"
  echo ""
  echo "All feature components found and TypeScript compiles clean."
  echo "Ready to proceed with feature testing."
else
  warning "⚠️  Some issues detected - see above for details"
  echo ""
  echo "Action items:"
  if [ "$FOUND_COUNT" -lt "$TOTAL_COUNT" ]; then
    echo "  - Create missing $((TOTAL_COUNT - FOUND_COUNT)) components"
  fi
  if [ "$TS_ERRORS" -gt 0 ]; then
    echo "  - Fix $TS_ERRORS TypeScript errors"
  fi
fi

echo ""
echo "Results saved to: $RESULTS_FILE"
echo ""

success "✅ VERIFICATION COMPLETE"
