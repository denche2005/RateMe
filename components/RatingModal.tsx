
import React, { useState } from 'react';
import { BadgeType } from '../types';
import { NeonButton, BadgeIcon } from './NeonComponents';

interface Props {
  targetName: string;
  onClose: () => void;
  onSubmit: (score: number, badges: Record<string, number>) => void;
}

export const RatingModal: React.FC<Props> = ({ targetName, onClose, onSubmit }) => {
  // Use BadgeType directly
  const categories = [
    { id: BadgeType.INTELLIGENCE, label: 'Intelligence' },
    { id: BadgeType.CHARISMA, label: 'Charisma' },
    { id: BadgeType.AFFECTIONATE, label: 'Affectionate' },
    { id: BadgeType.HUMOR, label: 'Humor' },
    { id: BadgeType.ACTIVE, label: 'Active' },
    { id: BadgeType.EXTROVERTED, label: 'Extroverted' },
  ];

  // Initialize all categories with a default of 2.5 (Mid)
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>(
    categories.reduce((acc, cat) => ({ ...acc, [cat.id]: 2.5 }), {})
  );

  const handleCategoryChange = (id: string, value: number) => {
    setCategoryScores(prev => ({ ...prev, [id]: value }));
  };

  const calculateAverage = () => {
    const values = Object.values(categoryScores) as number[];
    const sum = values.reduce((a, b) => a + b, 0);
    return values.length ? sum / values.length : 0;
  };

  const currentAverage = calculateAverage();

  const handleSubmit = () => {
    onSubmit(currentAverage, categoryScores);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-theme-card w-full max-w-sm rounded-3xl flex flex-col border border-theme-divider shadow-2xl relative overflow-hidden transition-colors duration-300">
        
        {/* Compact Header */}
        <div className="px-6 py-4 border-b border-theme-divider bg-theme-bg/50 flex justify-between items-center">
          <div>
              <div className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest">RATING</div>
              <h2 className="text-base font-black text-theme-text truncate max-w-[200px]">{targetName}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-theme-bg flex items-center justify-center text-theme-text hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Compact List */}
        <div className="p-5 space-y-4 bg-theme-card">
            {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-4">
                    {/* SVG Icon from Radar Chart */}
                    <div className="w-10 h-10 flex items-center justify-center bg-theme-bg rounded-xl border border-theme-divider shadow-sm shrink-0">
                        <BadgeIcon type={cat.id} className="w-5 h-5 text-theme-text" />
                    </div>

                    {/* Slider Container */}
                    <div className="flex-1 flex flex-col justify-center h-full gap-1.5">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-theme-secondary">{cat.label}</span>
                            <span className="text-xs font-mono font-bold text-theme-accent">{categoryScores[cat.id].toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="5" 
                            step="0.1" 
                            value={categoryScores[cat.id]}
                            onChange={(e) => handleCategoryChange(cat.id, parseFloat(e.target.value))}
                            className="w-full h-2 bg-theme-bg rounded-full appearance-none cursor-pointer border border-theme-divider/50"
                            style={{
                                backgroundImage: `linear-gradient(90deg, var(--theme-secondary), var(--theme-primary))`,
                                backgroundSize: `${(categoryScores[cat.id] / 5) * 100}% 100%`,
                                backgroundRepeat: 'no-repeat'
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme-divider bg-theme-bg/50">
           <NeonButton onClick={handleSubmit} className="w-full py-3 text-base shadow-lg">
             Submit Rating
           </NeonButton>
        </div>
      </div>
    </div>
  );
};

// --- READ ONLY SUMMARY MODAL ---
interface SummaryProps {
    raterName: string;
    badgeScores: Record<BadgeType, number>;
    onClose: () => void;
}

export const RatingSummaryModal: React.FC<SummaryProps> = ({ raterName, badgeScores, onClose }) => {
    // Use BadgeType directly
    const categories = [
        { id: BadgeType.INTELLIGENCE, label: 'Intelligence' },
        { id: BadgeType.CHARISMA, label: 'Charisma' },
        { id: BadgeType.AFFECTIONATE, label: 'Affectionate' },
        { id: BadgeType.HUMOR, label: 'Humor' },
        { id: BadgeType.ACTIVE, label: 'Active' },
        { id: BadgeType.EXTROVERTED, label: 'Extroverted' },
    ];

    const getProgressStyle = (val: number) => {
        const max = 5;
        const percentage = (val / max) * 100;
        return { width: `${percentage}%` };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-6">
            <div className="bg-theme-card w-full max-w-sm rounded-3xl p-6 border border-theme-accent/20 shadow-2xl relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-theme-bg flex items-center justify-center text-theme-secondary hover:text-theme-text transition-colors"
                >
                    ✕
                </button>

                <div className="text-center mb-6">
                    <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-widest mb-1">RATING DETAILS</h3>
                    <h2 className="text-xl font-black text-theme-text">From {raterName}</h2>
                </div>

                <div className="space-y-4">
                    {categories.map(cat => {
                        const score = badgeScores[cat.id] || 0;
                        return (
                            <div key={cat.id} className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2 font-bold text-theme-text">
                                        <BadgeIcon type={cat.id} className="w-4 h-4 text-theme-text" />
                                        <span>{cat.label}</span>
                                    </div>
                                    <span className="font-mono text-theme-text">{score.toFixed(1)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-theme-bg rounded-full overflow-hidden border border-theme-divider/30">
                                    <div 
                                        className="h-full bg-brand-gradient rounded-full transition-all duration-500"
                                        style={getProgressStyle(score)}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8">
                    <NeonButton onClick={onClose} className="w-full py-3">Close</NeonButton>
                </div>
            </div>
        </div>
    );
};
