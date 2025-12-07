import React from 'react';
import { Post, User } from '../types';
import { Avatar, ScoreBadge } from './NeonComponents';

interface Props {
  post: Post;
  onClose: () => void;
  users: User[]; 
}

export const PostInsightsSheet: React.FC<Props> = ({ post, onClose, users }) => {
  
  // Empty array as requested ("let it empty for now")
  const raters: any[] = [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="relative w-full max-w-md bg-theme-card rounded-t-3xl h-[60vh] flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out]">
        
        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-500/50 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-theme-divider flex justify-between items-center">
            <div>
                <h3 className="font-black text-theme-text text-xl uppercase tracking-widest">Post Insights</h3>
                <p className="text-xs text-theme-secondary">Analytics & Recent Activity</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-theme-bg flex items-center justify-center text-theme-text hover:bg-theme-divider transition-colors">✕</button>
        </div>

        {/* Stats Summary */}
        <div className="flex justify-around p-6 border-b border-theme-divider bg-theme-bg/30">
            <div className="text-center">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-brand-gradient">
                    {post.averageRating.toFixed(1)}
                </div>
                <div className="text-[10px] text-theme-secondary font-bold uppercase tracking-widest">Avg Score</div>
            </div>
            <div className="w-px bg-theme-divider"></div>
            <div className="text-center">
                <div className="text-3xl font-black text-theme-text">
                    {post.ratingCount}
                </div>
                <div className="text-[10px] text-theme-secondary font-bold uppercase tracking-widest">Total Ratings</div>
            </div>
        </div>

        {/* Rater List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
           <h4 className="text-xs font-bold text-theme-secondary uppercase mb-2 pl-2">Recent Raters</h4>
           {raters.map((rater) => (
               <div key={rater.id} className="flex items-center justify-between p-3 rounded-xl bg-theme-bg border border-theme-divider">
                   <div className="flex items-center gap-3">
                       <Avatar url={rater.user.avatarUrl} size="sm" />
                       <div>
                           <div className="font-bold text-theme-text text-sm">{rater.user.displayName}</div>
                           <div className="text-xs text-theme-secondary">{rater.time}</div>
                       </div>
                   </div>
                   <div className="flex items-center gap-2">
                       <ScoreBadge score={rater.score} />
                   </div>
               </div>
           ))}
           {raters.length === 0 && (
               <div className="text-center text-theme-secondary py-8">
                   No ratings available yet.
               </div>
           )}
        </div>
      </div>
    </div>
  );
};