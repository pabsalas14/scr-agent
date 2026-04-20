#!/bin/bash

# Monitor juice-shop analysis with qwen2.5-coder-14b
ANALYSIS_ID="cmo7drvqd0005poqe6i0bhd63"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbzZlMXZidTAwMDY1bDBsdTcxa294dTAiLCJlbWFpbCI6ImFkbWluQHNjci5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzY2OTkwMjYsImV4cCI6MTc3Njc4NTQyNn0.4wcJ68NPBO3qdU1GZdeUUGC2CoCFx3j1gI1YQYwXFUA"
LOG_FILE="/tmp/analysis-monitor.log"

echo "🚀 Iniciando monitoreo de análisis juice-shop (qwen2.5-coder-14b)" > "$LOG_FILE"
echo "ID: $ANALYSIS_ID" >> "$LOG_FILE"
echo "Inicio: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

last_progress=""
last_st=""
start_time=$(date +%s)

while true; do
  curr_time=$(date '+%Y-%m-%d %H:%M:%S')

  # Fetch current state
  data=$(curl -s -X GET "http://localhost:3001/api/v1/analyses/$ANALYSIS_ID" \
    -H "Authorization: Bearer $TOKEN" 2>&1 | jq -r '.data | "\(.status)|\(.progress)|\(.errorMessage // "null")"' 2>/dev/null)

  if [ $? -ne 0 ] || [ -z "$data" ]; then
    echo "[$curr_time] ⚠️ Error fetching status" >> "$LOG_FILE"
    sleep 30
    continue
  fi

  st=$(echo "$data" | cut -d'|' -f1)
  prog=$(echo "$data" | cut -d'|' -f2)
  err=$(echo "$data" | cut -d'|' -f3)

  # Only log if changed
  if [ "$prog" != "$last_progress" ] || [ "$st" != "$last_st" ]; then
    elapsed=$(($(date +%s) - start_time))
    elapsed_min=$((elapsed / 60))

    # Calculate ETA if progressing
    if [ "$prog" != "0" ] && [ "$prog" != "$last_progress" ] && [ ! -z "$last_progress" ]; then
      eta_total=$((elapsed * 100 / prog))
      eta_remaining=$((eta_total - elapsed))
      eta_min=$((eta_remaining / 60))
      echo "[$curr_time] 📊 Status: $st | Progress: $prog% | Elapsed: ${elapsed_min}m | ETA: ${eta_min}m" >> "$LOG_FILE"
    else
      echo "[$curr_time] 📊 Status: $st | Progress: $prog% | Elapsed: ${elapsed_min}m" >> "$LOG_FILE"
    fi

    last_progress="$prog"
    last_st="$st"
  fi

  # Check if done
  if [ "$st" = "COMPLETED" ] || [ "$st" = "FAILED" ] || [ "$st" = "CANCELLED" ]; then
    elapsed=$(($(date +%s) - start_time))
    echo "" >> "$LOG_FILE"
    echo "✅ Análisis finalizado!" >> "$LOG_FILE"
    echo "Status: $st" >> "$LOG_FILE"
    echo "Progress: $prog%" >> "$LOG_FILE"
    echo "Tiempo total: $((elapsed / 60))m $((elapsed % 60))s" >> "$LOG_FILE"
    [ "$err" != "null" ] && echo "Error: $err" >> "$LOG_FILE"
    break
  fi

  sleep 30
done

echo ""
echo "Log guardado en: $LOG_FILE"
tail -20 "$LOG_FILE"
