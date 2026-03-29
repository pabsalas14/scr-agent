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
  // Invert score if necessary: assuming 0 is safe, 100 is critical risk
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s < 30) return '#00FF94'; // CODA Safe Green
    if (s < 60) return '#00D1FF'; // CODA Cyan
    if (s < 85) return '#7000FF'; // CODA Purple
    return '#FF3B3B'; // CODA Critical Red
  };

  const getLabel = (s: number) => {
    if (s < 30) return 'Assured';
    if (s < 60) return 'Elevated';
    if (s < 85) return 'Critical';
    return 'Breach Risk';
  };

  const color = getColor(score);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 group" style={{ width: size, height: size }}>
      {/* Background Glow */}
      <div 
        className="absolute inset-0 blur-3xl opacity-10 transition-colors duration-1000" 
        style={{ backgroundColor: color }} 
      />

      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#111218"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Fill */}
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
          style={{ 
            filter: `drop-shadow(0 0 8px ${color}80)` 
          }}
        />

        {/* Marker Dot */}
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

      {/* Centered Indicators */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
        <div className="flex flex-col items-center">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-5xl font-black text-white tracking-tighter leading-none"
            >
              {score}
            </motion.span>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-2 flex flex-col items-center"
            >
                <div className="h-[1px] w-8 bg-[#1F2937] mb-2" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Risk Score</span>
                <span 
                  className="text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded border border-current shadow-sm"
                  style={{ color, borderColor: `${color}40` }}
                >
                  {getLabel(score)}
                </span>
            </motion.div>
        </div>
      </div>

      {/* Hexagon Pattern Grid (Subtle Overlay) */}
      <div className="absolute inset-4 border border-[#1F2937] rounded-full opacity-20 pointer-events-none" />
      <div className="absolute inset-8 border border-[#1F2937] rounded-full opacity-10 pointer-events-none" />
    </div>
  );
}
