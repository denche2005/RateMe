
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { BadgeType } from '../types';
import { BadgeIcon } from './NeonComponents';

interface Props {
  data: Record<BadgeType, number>;
  theme: 'dark' | 'light';
  onAxisClick?: (label: string, score: number) => void; 
  onValueClick?: (label: string, score: number) => void;
}

export const RadarChartComponent: React.FC<Props> = ({ data, theme, onAxisClick }) => {
  // Explicit Order (Clockwise from Top)
  // 12:00 Intelligence
  // 02:00 Charisma
  // 04:00 Affectionate
  // 06:00 Humor
  // 08:00 Active
  // 10:00 Extroverted
  const order = [
    BadgeType.INTELLIGENCE, 
    BadgeType.CHARISMA,     
    BadgeType.AFFECTIONATE, 
    BadgeType.HUMOR,        
    BadgeType.ACTIVE,       
    BadgeType.EXTROVERTED   
  ];

  const chartData = order.map(subject => ({
    subject,
    A: data[subject] || 0,
    fullMark: 5, 
  }));

  const gridColor = theme === 'dark' ? '#333333' : '#e5e7eb';

  // --- Custom Icon Tick ---
  // Renders the icon at the axis tip. Now Clickable.
  const CustomTick = ({ payload, x, y, cx, cy }: any) => {
      if (typeof x !== 'number' || typeof y !== 'number') return null;

      const iconSize = 24;
      const gap = 15; // Closer to chart

      // Calculate unit vector
      const dx = x - cx;
      const dy = y - cy;
      const length = Math.sqrt(dx * dx + dy * dy);
      const nx = length ? dx / length : 0;
      const ny = length ? dy / length : 0;

      const finalX = x + (nx * gap);
      const finalY = y + (ny * gap);
      
      // Get score for this badge
      const score = data[payload.value as BadgeType] || 0;

      return (
          <g transform={`translate(${finalX - iconSize/2},${finalY - iconSize/2})`}>
             <g 
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onAxisClick) onAxisClick(payload.value, score);
                }}
             >
                {/* Invisible hit box for easier clicking */}
                <rect x={-10} y={-10} width={iconSize + 20} height={iconSize + 20} fill="transparent" />
                
                <BadgeIcon 
                    type={payload.value} 
                    width={iconSize}
                    height={iconSize}
                    className="text-theme-text drop-shadow-md hover:text-theme-accent transition-colors" 
                />
             </g>
          </g>
      );
  };

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
            cx="50%" 
            cy="50%" 
            outerRadius="60%" 
            data={chartData} 
            startAngle={90} 
            endAngle={-270}
        >
          <PolarGrid stroke={gridColor} gridType="polygon" />
          
          <PolarAngleAxis 
            dataKey="subject" 
            tick={(props) => <CustomTick {...props} />}
          />
          
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 5]} 
            ticks={[2.5, 5]} // "Couple of ones" - Only Middle and Edge
            tick={false} 
            axisLine={false} 
            type="number"
          />
          
          <Radar
            name="Skills"
            dataKey="A"
            stroke="var(--accent)"
            strokeWidth={3}
            fill="var(--accent)"
            fillOpacity={0.5}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-in-out"
            dot={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
