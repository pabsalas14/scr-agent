import { motion } from 'framer-motion';

interface RiskScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function RiskScoreGauge({
  score,
  size = 200,
  strokeWidth = 14,
}: RiskScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s < 30) return '#22C55E';
    if (s < 60) return '#F97316';
    if (s < 85) return '#EAB308';
    return '#EF4444';
  };

  const getLabel = (s: number) => {
    if (s < 30) return 'Protegido';
    if (s < 60) return 'Elevado';
    if (s < 85) return 'Crítico';
    return 'Riesgo de Brecha';
  };

  const color = getColor(score);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 group" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 blur-3xl opacity-10 transition-colors duration-1000"
        style={{ backgroundColor: color }}
      />

      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2D2D2D"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
        <motion.circle
          cx={size / 2 + radius * Math.cos(0)}
          cy={size / 2 + radius * Math.sin(0)}
          r={strokeWidth / 3}
          fill="white"
          animate={{
            cx: size / 2 + radius * Math.cos((score / 100) * 2 * Math.PI),
            cy: size / 2 + radius * Math.sin((score / 100) * 2 * Math.PI),
          }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: 'drop-shadow(0 0 4px white)' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
        <div className="flex flex-col items-center gap-1">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-6xl font-bold text-white leading-none"
          >
            {Math.round(score)}
          </motion.span>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="h-0.5 w-6 bg-[#2D2D2D]" />
            <span className="text-[8px] font-semibold text-[#4B5563] uppercase tracking-widest whitespace-nowrap">Amenaza</span>
            <span
              className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border"
              style={{ color, backgroundColor: `${color}10`, borderColor: `${color}40` }}
            >
              {getLabel(score)}
            </span>
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-4 border border-[#2D2D2D] rounded-full opacity-20 pointer-events-none" />
      <div className="absolute inset-8 border border-[#2D2D2D] rounded-full opacity-10 pointer-events-none" />
    </div>
  );
}
