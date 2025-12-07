
import React, { useEffect, useState, useRef } from 'react';
import { Notification, BadgeType } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  glow?: boolean;
  className?: string;
}

export const RateCoinIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <div className={`rounded-full border-2 border-yellow-400 flex items-center justify-center bg-yellow-400/10 text-yellow-400 font-black shrink-0 ${className}`}>
     <span className="relative top-[0.5px] leading-none" style={{ fontSize: '65%' }}>R</span>
  </div>
);

export const NeonButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  glow = false, 
  className = '', 
  ...props 
}) => {
  // Canva-esque: Rounded, Soft Shadows, Gradient
  const baseStyle = "px-6 py-3 rounded-xl font-bold transition-all duration-300 transform active:scale-[0.98] tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
  
  let variantStyle = "";
  if (variant === 'primary') {
    variantStyle = "bg-brand-gradient text-white border-none shadow-soft-md hover:shadow-soft-xl hover:brightness-105";
  } else if (variant === 'secondary') {
    variantStyle = "bg-transparent text-theme-text border border-theme-divider hover:border-theme-accent hover:text-theme-accent";
  } else if (variant === 'danger') {
    variantStyle = "bg-red-50 to-red-100 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white";
  }

  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const BackArrow: React.FC<{ onClick: () => void, className?: string }> = ({ onClick, className = '' }) => {
  return (
    <button 
      onClick={onClick}
      className={`w-11 h-11 flex items-center justify-center rounded-2xl bg-theme-bg/40 backdrop-blur-md border border-theme-text/10 text-theme-text hover:bg-theme-text/10 hover:border-theme-accent/50 transition-all active:scale-95 group shadow-sm ${className}`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2.5} 
        stroke="currentColor" 
        className="w-5 h-5 group-hover:text-theme-accent transition-colors"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
    </button>
  );
};

// Updated BadgeIcon to spread props correctly for SVG nesting (x, y, width, height)
export const BadgeIcon: React.FC<{ type: string | BadgeType } & React.SVGProps<SVGSVGElement>> = ({ type, className = "w-6 h-6", ...props }) => {
  const commonProps = {
     className: className,
     fill: "none",
     stroke: "currentColor",
     strokeWidth: 1.5,
     strokeLinecap: "round" as const,
     strokeLinejoin: "round" as const,
     viewBox: "0 0 24 24",
     ...props // Spread all other props (like x, y from Recharts)
  };

  switch (type) {
     case BadgeType.INTELLIGENCE:
     case 'Intelligence':
        return (
           <svg {...commonProps}>
               {/* NEW BRAIN ICON (Outline Style) */}
               <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
               <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
           </svg>
        );
     case BadgeType.CHARISMA:
     case 'Charisma':
        return (
           <svg {...commonProps}>
               {/* Sparkle / Star */}
               <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15.75a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V16.5a.75.75 0 01.75-.75zm9.75-9a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V7.5a.75.75 0 01.75-.75z" clipRule="evenodd" fill="currentColor" stroke="none"/>
           </svg>
        );
     case BadgeType.AFFECTIONATE:
     case 'Affectionate':
        return (
           <svg {...commonProps}>
               {/* Heart */}
               <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" fill="currentColor" stroke="none" />
           </svg>
        );
     case BadgeType.HUMOR:
     case 'Humor':
        return (
           <svg {...commonProps}>
                {/* SMILEY FACE */}
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.25 6.25a1 1 0 10-2 0 1 1 0 002 0zm4.25 1a1 1 0 110-2 1 1 0 010 2zm-7.833 3.667a.75.75 0 011.06-1.06 6.756 6.756 0 007.046 0 .75.75 0 111.06 1.06c-2.28 2.28-6.886 2.28-9.166 0z" clipRule="evenodd" fill="currentColor" stroke="none"/>
           </svg>
        );
     case BadgeType.ACTIVE:
     case 'Active':
        return (
           <svg {...commonProps}>
               {/* Lightning */}
               <path d="M7 2v11h3v9l7-12h-4l4-8z" fill="currentColor" stroke="none"/>
           </svg>
        );
     case BadgeType.EXTROVERTED:
     case 'Extroverted':
        return (
           <svg {...commonProps}>
              {/* NEW PARTY POPPER ICON (Outline Style) */}
              <path d="M5.8 11.3 2 22l10.7-3.79" />
              <path d="M4 3h.01" strokeWidth="2" />
              <path d="M22 8h.01" strokeWidth="2" />
              <path d="M15 2h.01" strokeWidth="2" />
              <path d="M22 20h.01" strokeWidth="2" />
              <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v.11a2.9 2.9 0 0 0 .969 2.37L22 11" />
              <path d="m11 13-2.375-.59a2.9 2.9 0 0 0-2.375.59h-.01a2.9 2.9 0 0 0-.59 2.375L6 18" />
              <path d="m16 8 4-4" />
              <path d="m16 11 2-2" />
           </svg>
        );
     default:
        return null;
  }
};

export const Avatar: React.FC<{ url: string; size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'profile'; border?: boolean; className?: string }> = ({ 
  url, 
  size = 'md',
  border = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    profile: 'w-28 h-28',
    xl: 'w-32 h-32',
    '2xl': 'w-48 h-48'
  };

  // Gradient Border wrapper
  if (border) {
    return (
      <div className={`${sizeClasses[size]} rounded-full p-[2px] bg-brand-gradient shadow-sm ${className}`}>
        <div className="w-full h-full rounded-full border-2 border-theme-card overflow-hidden bg-theme-bg">
          <img src={url} alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-sm ${className}`}>
      <img src={url} alt="User" className="w-full h-full object-cover rounded-full" />
    </div>
  );
};

export const ScoreBadge: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({ score, size = 'sm' }) => {
  // Using Brand Colors for scores
  // High scores get the brand gradient text clip
  
  // Scale 0-5 logic: 4+ is High, 2.5+ is Mid.
  let colorClass = 'text-gray-500';
  let isGradient = false;

  if (score >= 4.0) isGradient = true;
  else if (score >= 2.5) colorClass = 'text-blue-500';
  
  const fontSize = size === 'lg' ? 'text-5xl tracking-tighter' : 'text-xl tracking-tight';
  
  if (isGradient) {
    return (
        <div className={`font-black text-transparent bg-clip-text bg-brand-gradient ${fontSize} font-sans`}>
          {score.toFixed(1)}
        </div>
    );
  }

  return (
    <div className={`font-black ${colorClass} ${fontSize} font-sans`}>
      {score.toFixed(1)}
    </div>
  );
};

export const RatingFlash: React.FC<{ score: number | null }> = ({ score }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (score !== null) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [score]);

  if (!visible || score === null) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="animate-[bounce_0.5s_ease-in-out]">
         <div className="text-8xl font-black text-transparent bg-clip-text bg-brand-gradient drop-shadow-2xl">
           {score.toFixed(1)}
         </div>
      </div>
    </div>
  );
};

export const NotificationToast: React.FC<{ 
  notification: Notification | null, 
  currentUserId: string,
  userFriends: string[],
  onClose: () => void,
  onRateBack?: (id: string) => void,
  onPostClick?: (postId: string) => void
}> = ({ notification, currentUserId, userFriends, onClose, onRateBack, onPostClick }) => {
  
  const [visible, setVisible] = useState(false);
  const touchStartX = useRef(0);
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 2500); // Display time
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
       // Swipe detected
       setVisible(false);
       setTimeout(onClose, 300);
    }
  };

  const handleClick = () => {
    if (notification?.postId && onPostClick) {
      onPostClick(notification.postId);
      onClose();
    } else {
      onClose(); 
    }
  };

  if (!notification || !visible) return null;

  const isRating = notification.type === 'RATING';
  
  // Dynamic border color based on type
  const accentBorder = isRating 
    ? 'border-l-4 border-l-[#3b82f6]' // Blue for rating
    : 'border-l-4 border-l-[#8b5cf6]'; // Purple for described

  return (
    <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center pointer-events-auto">
      <div 
        ref={toastRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        className={`bg-theme-card border border-theme-divider/50 shadow-xl rounded-lg p-3 pr-4 flex items-center gap-3 animate-[slideDown_0.4s_ease-out] cursor-pointer active:scale-95 transition-all select-none max-w-sm w-[90%] ${accentBorder}`}
      >
         {/* Icon or Thumbnail */}
         <div className="relative shrink-0">
           {notification.postMediaUrl ? (
             <div className="w-10 h-10 rounded-md overflow-hidden border border-theme-divider">
               <img src={notification.postMediaUrl} alt="Post" className="w-full h-full object-cover" />
             </div>
           ) : (
             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isRating ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                {notification.emoji}
             </div>
           )}
         </div>
         
         {/* Text */}
         <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between">
               <span className="font-bold text-sm text-theme-text truncate">{notification.raterName}</span>
               <span className="text-[10px] text-theme-secondary opacity-70">Just now</span>
            </div>
            
            <p className="text-xs text-theme-secondary leading-tight mt-0.5">
               {isRating ? 'Rated your post' : 'Described your vibe'}
            </p>

            {isRating && (
               <div className="text-sm font-black text-transparent bg-clip-text bg-brand-gradient mt-0.5">
                  {notification.score.toFixed(1)} <span className="text-xs font-normal text-theme-secondary">/ 5.0</span>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export interface ToastProps { 
    message?: string | null; 
    toast?: { message: string, icon?: React.ReactNode } | null;
    onClose: () => void 
}

export const Toast: React.FC<ToastProps> = ({ message, toast, onClose }) => {
  const activeToast = toast || (message ? { message } : null);
  const [visible, setVisible] = useState(false);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (activeToast) {
      setVisible(true);
      const timer = setTimeout(() => {
          setVisible(false);
          setTimeout(onClose, 300);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [activeToast, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
       // Swipe detected
       setVisible(false);
       setTimeout(onClose, 300);
    }
  };

  if (!activeToast || !visible) return null;

  return (
    <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] animate-[slideDownFade_0.3s_ease-out] w-full max-w-sm px-4 flex justify-center cursor-grab active:cursor-grabbing"
    >
       <div className="bg-theme-card border border-theme-divider text-theme-text px-6 py-4 rounded-xl shadow-lg flex items-center gap-4 min-w-[220px] justify-center">
          <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold shadow-sm shrink-0">
             {activeToast.icon ? activeToast.icon : <span className="text-xs">✓</span>}
          </div>
          <span className="font-bold text-sm tracking-wide text-theme-text drop-shadow-sm">{activeToast.message}</span>
       </div>
    </div>
  );
};

export const DailyStreakModal: React.FC<{ day: number, reward: number, onClose: () => void }> = ({ day, reward, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-6">
       <div className="bg-theme-card w-full max-w-sm rounded-3xl p-8 border border-theme-accent/30 shadow-[0_0_80px_rgba(59,130,246,0.2)] relative flex flex-col items-center text-center">
           
           <div className="text-6xl mb-4 animate-[bounce_1s_infinite]">🔥</div>
           
           <h2 className="text-3xl font-black text-transparent bg-clip-text bg-brand-gradient mb-1 uppercase tracking-tighter">
             Daily Streak
           </h2>
           <p className="text-theme-secondary font-bold text-sm uppercase tracking-widest mb-8">
             Keep the fire burning
           </p>

           <div className="w-full bg-theme-bg rounded-2xl p-4 border border-theme-divider mb-8">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-theme-secondary text-xs uppercase font-bold">Current Streak</span>
                  <span className="text-theme-text text-xl font-black">{day} Days</span>
               </div>
               <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-brand-gradient rounded-full"
                     style={{ width: `${Math.min((day / 30) * 100, 100)}%` }}
                   ></div>
               </div>
           </div>

           <div className="mb-8">
               <div className="text-theme-secondary text-xs uppercase font-bold mb-1">Today's Reward</div>
               <div className="flex items-center justify-center gap-2 text-4xl font-black text-theme-text drop-shadow-sm">
                  <span>+{reward}</span>
                  <div className="flex items-center gap-1">
                      <RateCoinIcon className="w-8 h-8 text-xl" />
                      <span className="text-yellow-400 text-lg">RateCoins</span>
                  </div>
               </div>
           </div>

           <NeonButton onClick={onClose} glow className="w-full text-lg py-4">
              Claim Reward ⚡️
           </NeonButton>
       </div>
    </div>
  );
};
