import { motion } from 'framer-motion';

interface RiskScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function RiskScoreGauge({
  score,
  size = 280,
  strokeWidth = 16,
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
    return 'Crítico';
  };

  const color = getColor(score);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        {/* Background glow */}
        <div
          className="absolute inset-0 blur-3xl opacity-20 transition-colors duration-1000 rounded-full"
          style={{ backgroundColor: color }}
        />

        {/* Main gauge SVG */}
        <svg width={size} height={size} className="transform -rotate-90 relative z-10 drop-shadow-lg">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2D2D2D"
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity="0.3"
          />

          {/* Animated progress circle */}
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
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />

          {/* Progress indicator dot */}
          <motion.circle
            cx={size / 2 + radius * Math.cos(0)}
            cy={size / 2 + radius * Math.sin(0)}
            r={strokeWidth / 2.5}
            fill={color}
            animate={{
              cx: size / 2 + radius * Math.cos((score / 100) * 2 * Math.PI),
              cy: size / 2 + radius * Math.sin((score / 100) * 2 * Math.PI),
            }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Score number */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-6xl font-black text-white leading-none" style={{ textShadow: `0 0 20px ${color}40` }}>
                {Math.round(score)}
              </span>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">de 100</span>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="h-px w-8 bg-gradient-to-r from-transparent via-[#2D2D2D] to-transparent"
            />

            {/* Label section */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-widest">Nivel de Amenaza</span>
              <span
                className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border-2 font-mono"
                style={{ color, backgroundColor: `${color}15`, borderColor: `${color}50` }}
              >
                {getLabel(score)}
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative rings */}
        <div className="absolute inset-6 border border-[#2D2D2D] rounded-full opacity-10 pointer-events-none" />
        <div className="absolute inset-12 border border-[#2D2D2D] rounded-full opacity-5 pointer-events-none" />
      </div>

      {/* Risk scale legend */}
      <div className="mt-8 grid grid-cols-4 gap-2 w-full max-w-xs">
        {[
          { label: 'Bajo', color: '#22C55E', range: '0-29' },
          { label: 'Medio', color: '#F97316', range: '30-59' },
          { label: 'Alto', color: '#EAB308', range: '60-84' },
          { label: 'Crítico', color: '#EF4444', range: '85-100' },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="h-2 w-full rounded-full mb-1" style={{ backgroundColor: `${item.color}40`, borderLeft: `3px solid ${item.color}` }} />
            <p className="text-[10px] font-semibold text-[#94A3B8]">{item.label}</p>
            <p className="text-[8px] text-[#64748B]">{item.range}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
