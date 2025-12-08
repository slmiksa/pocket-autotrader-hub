import { useEffect, useState } from "react";
interface AnalogClockProps {
  size?: number;
  className?: string;
}
export const AnalogClock = ({
  size = 50,
  className
}: AnalogClockProps) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Convert to Mecca time (UTC+3)
  const meccaOffset = 3 * 60; // 3 hours in minutes
  const localOffset = time.getTimezoneOffset();
  const meccaTime = new Date(time.getTime() + (meccaOffset + localOffset) * 60 * 1000);
  const seconds = meccaTime.getSeconds();
  const minutes = meccaTime.getMinutes();
  const hours = meccaTime.getHours() % 12;
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;
  const center = size / 2;
  const radius = size / 2 - 2;
  return <div className={`relative flex flex-col items-center ${className || ''}`} title={`توقيت مكة: ${meccaTime.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  })}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Clock face */}
        <circle cx={center} cy={center} r={radius} fill="transparent" stroke="white" strokeWidth="2" />
        
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const innerRadius = radius - 5;
        const outerRadius = radius - 1;
        const x1 = center + innerRadius * Math.cos(angle);
        const y1 = center + innerRadius * Math.sin(angle);
        const x2 = center + outerRadius * Math.cos(angle);
        const y2 = center + outerRadius * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={i % 3 === 0 ? "2" : "1"} />;
      })}
        
        {/* Hour hand */}
        <line x1={center} y1={center} x2={center + radius * 0.5 * Math.cos((hourDeg - 90) * (Math.PI / 180))} y2={center + radius * 0.5 * Math.sin((hourDeg - 90) * (Math.PI / 180))} stroke="white" strokeWidth="3" strokeLinecap="round" />
        
        {/* Minute hand */}
        <line x1={center} y1={center} x2={center + radius * 0.7 * Math.cos((minuteDeg - 90) * (Math.PI / 180))} y2={center + radius * 0.7 * Math.sin((minuteDeg - 90) * (Math.PI / 180))} stroke="white" strokeWidth="2" strokeLinecap="round" />
        
        {/* Second hand */}
        <line x1={center} y1={center} x2={center + radius * 0.8 * Math.cos((secondDeg - 90) * (Math.PI / 180))} y2={center + radius * 0.8 * Math.sin((secondDeg - 90) * (Math.PI / 180))} stroke="white" strokeWidth="1" strokeLinecap="round" />
        
        {/* Center dot */}
        <circle cx={center} cy={center} r={3} fill="white" />
      </svg>
      
    </div>;
};