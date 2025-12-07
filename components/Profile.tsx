
import React, { useEffect, useState } from 'react';
import { User, Post, BadgeType } from '../types';
import { Avatar, NeonButton, ScoreBadge, BackArrow, Toast, BadgeIcon, RateCoinIcon } from './NeonComponents';
import { RadarChartComponent } from './RadarChartComponent';
import { generateAIVibeCheck } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  user: User;
  isOwnProfile?: boolean;
  allPosts: Post[]; // Receive all posts to filter for this user
  savedPosts?: Post[]; 
  repostedPosts?: Post[];
  onRateUser?: () => void;
  onBack?: () => void;
  onEditProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenStore?: () => void;
  onChat?: () => void;
  onFollow?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onPostClick?: (post: Post) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  viewerFriends?: string[]; 
}

const VibeCheckModal = ({ text, onClose, loading }: { text: string, onClose: () => void, loading: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-6">
      <div className="bg-theme-card w-full max-w-sm rounded-2xl p-6 border border-theme-accent/30 shadow-[0_0_50px_rgba(125,42,232,0.2)] relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-theme-bg flex items-center justify-center text-theme-secondary hover:text-theme-text"
          >
            ✕
          </button>
          
          <div className="text-center mb-6">
              <div className="text-5xl mb-4 animate-[bounce_2s_infinite]">✨</div>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-brand-gradient">Vibe Check</h3>
          </div>

          {loading ? (
             <div className="flex flex-col items-center py-8">
                <div className="w-8 h-8 border-4 border-theme-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-theme-secondary animate-pulse">Analyzing aura...</p>
             </div>
          ) : (
             <div className="text-center py-4">
                <p className="text-lg text-theme-text font-medium leading-relaxed">
                   "{text}"
                </p>
                <div className="mt-8">
                   <NeonButton onClick={onClose} className="w-full">Cool</NeonButton>
                </div>
             </div>
          )}
      </div>
  </div>
);

const StreakInfoModal = ({ days, onClose }: { days: number, onClose: () => void }) => {
   const currentMultiplier = (1 + (days * 0.05)).toFixed(2);
   
   const milestones = [
      { day: 3, reward: '+10% RateCoins', icon: '🥉' },
      { day: 7, reward: 'Profile Frame', icon: '🥈' },
      { day: 14, reward: 'Auto-Vibe Check', icon: '🥇' },
      { day: 30, reward: 'Golden Badge', icon: '👑' }
   ];

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-6">
         <div className="bg-theme-card w-full max-w-sm rounded-3xl p-6 border border-theme-divider shadow-2xl relative overflow-hidden">
             
             {/* Background decoration */}
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-gradient opacity-10 blur-3xl rounded-full"></div>

             <button 
                onClick={onClose} 
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-theme-bg/80 backdrop-blur-sm flex items-center justify-center text-theme-secondary hover:text-theme-text z-20 hover:bg-theme-bg active:scale-95 transition-all duration-200 cursor-pointer shadow-sm border border-transparent hover:border-theme-divider"
             >
                ✕
             </button>

             <div className="text-center mb-6 relative z-10">
                <div className="text-5xl mb-2 animate-pulse">🔥</div>
                <h3 className="text-2xl font-black text-theme-text">Streak Rewards</h3>
                <p className="text-theme-secondary text-sm">Keep it burning to earn more.</p>
             </div>

             {/* Current Bonus Card */}
             <div className="bg-theme-bg/50 rounded-2xl p-4 border border-theme-accent/30 mb-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-brand-gradient"></div>
                 <h4 className="text-xs font-bold text-theme-secondary uppercase tracking-widest mb-1">Current Bonus</h4>
                 <div className="flex items-center justify-between">
                    <span className="text-theme-text font-bold">Coin Multiplier</span>
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-brand-gradient">x{currentMultiplier}</span>
                 </div>
             </div>

             {/* Timeline */}
             <div className="space-y-4">
                <h4 className="text-xs font-bold text-theme-secondary uppercase tracking-widest pl-2">Upcoming Rewards</h4>
                {milestones.map((m) => {
                   const isUnlocked = days >= m.day;
                   const isNext = !isUnlocked && days < m.day && days >= (milestones.find(prev => prev.day < m.day)?.day || 0);
                   
                   return (
                      <div 
                        key={m.day} 
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                           isUnlocked 
                             ? 'bg-theme-accent/10 border-theme-accent/30 opacity-100' 
                             : isNext 
                               ? 'bg-theme-card border-theme-text/20 opacity-100 ring-1 ring-theme-text/10' 
                               : 'bg-transparent border-transparent opacity-40'
                        }`}
                      >
                         <div className="text-xl">{m.icon}</div>
                         <div className="flex-1">
                            <div className="font-bold text-sm text-theme-text">{m.day} Day Streak</div>
                            <div className="text-xs text-theme-secondary">{m.reward}</div>
                         </div>
                         <div className="text-lg">
                            {isUnlocked ? '✅' : '🔒'}
                         </div>
                      </div>
                   );
                })}
             </div>

             <div className="mt-6">
                <NeonButton onClick={onClose} className="w-full py-3">Got it</NeonButton>
             </div>
         </div>
      </div>
   );
};

const OptionsSheet = ({ onClose, username }: { onClose: () => void, username: string }) => (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-auto">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
        <div className="relative w-full max-w-md bg-theme-card rounded-t-3xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] flex flex-col gap-3">
            <div className="w-12 h-1.5 bg-gray-500/50 rounded-full mx-auto mb-4"></div>
            
            <button className="w-full py-4 rounded-xl bg-theme-bg text-theme-text font-bold text-sm hover:bg-theme-divider transition-colors border border-theme-divider shadow-sm">
                Share Profile
            </button>
            <button className="w-full py-4 rounded-xl bg-theme-bg text-theme-text font-bold text-sm hover:bg-theme-divider transition-colors border border-theme-divider shadow-sm">
                About this Account
            </button>
             <button className="w-full py-4 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-colors border border-red-500/20 shadow-sm">
                Block @{username}
            </button>
            <button className="w-full py-4 rounded-xl bg-transparent text-theme-text font-bold text-sm mt-2 active:opacity-70" onClick={onClose}>
                Cancel
            </button>
        </div>
    </div>
);

export const Profile: React.FC<Props> = ({ 
  user, 
  isOwnProfile = false, 
  allPosts,
  savedPosts = [], 
  repostedPosts = [],
  onRateUser, 
  onBack, 
  onEditProfile, 
  onOpenSettings, 
  onOpenStore,
  onChat,
  onFollow,
  onFollowersClick,
  onFollowingClick,
  onPostClick,
  theme, 
  onToggleTheme,
  viewerFriends = []
}) => {
  const [vibeCheckText, setVibeCheckText] = useState<string>('');
  const [showVibeModal, setShowVibeModal] = useState(false);
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [loadingVibe, setLoadingVibe] = useState(false);
  const [activeTab, setActiveTab] = useState<'POSTS' | 'REPOSTS' | 'SAVED' | 'EVOLUTION'>('POSTS');
  
  const [followRequestStatus, setFollowRequestStatus] = useState<'NONE' | 'REQUESTING' | 'ACCEPTED'>('NONE');
  const [showUnfollowAlert, setShowUnfollowAlert] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // New State for Rich Toast (Icon + Text)
  const [radarToast, setRadarToast] = useState<{message: string, icon?: React.ReactNode} | null>(null);

  // Sync internal state with prop if user data updates externally
  const isFollowing = user.isFollowedByCurrentUser || followRequestStatus === 'ACCEPTED';
  
  const isContentLocked = !isOwnProfile && user.isPrivate && !isFollowing;

  // Filter real posts passed from App
  const userCreatedPosts = allPosts.filter(p => p.creatorId === user.id);

  const handleVibeCheck = async () => {
    setShowVibeModal(true);
    if (!vibeCheckText) {
        setLoadingVibe(true);
        const result = await generateAIVibeCheck(user);
        setVibeCheckText(result);
        setLoadingVibe(false);
    }
  };

  const handleFollowClick = () => {
      // Logic for handling follow/unfollow
      if (isFollowing) {
         // UNFOLLOW ATTEMPT
         if (user.isPrivate) {
            // Show warning for private accounts
            setShowUnfollowAlert(true);
         } else {
            // Direct unfollow for public accounts
            if (onFollow) onFollow();
         }
      } else {
         // FOLLOW ATTEMPT
         if (user.isPrivate) {
            setFollowRequestStatus('REQUESTING');
            setTimeout(() => {
                setFollowRequestStatus('ACCEPTED');
                if (onFollow) onFollow(); 
            }, 2000);
         } else {
            if (onFollow) onFollow();
         }
      }
  };

  const confirmUnfollow = () => {
      setShowUnfollowAlert(false);
      setFollowRequestStatus('NONE'); // Reset local request status
      if (onFollow) onFollow();
  };

  const chartColor = theme === 'dark' ? '#2DD4BF' : '#0D9488'; 
  const gridColor = theme === 'dark' ? '#1F2937' : '#E2E8F0'; 
  const textColor = theme === 'dark' ? '#9CA3AF' : '#64748B'; 
  const tooltipBg = theme === 'dark' ? '#111827' : '#FFFFFF';

  const TabButton = ({ id, icon }: { id: typeof activeTab, icon: React.ReactNode }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center pb-3 transition-all relative ${
          activeTab === id ? 'text-theme-text' : 'text-theme-secondary hover:text-theme-text/70'
      }`}
    >
      <div className={`${activeTab === id ? 'scale-110' : 'scale-100'} transition-transform`}>
          {icon}
      </div>
      {activeTab === id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-theme-text"></div>}
    </button>
  );

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar pb-24 bg-theme-bg text-theme-text animate-fade-in transition-colors duration-300">
      
      <Toast toast={radarToast} onClose={() => setRadarToast(null)} />

      {showVibeModal && (
         <VibeCheckModal 
            text={vibeCheckText} 
            loading={loadingVibe} 
            onClose={() => setShowVibeModal(false)} 
         />
      )}

      {showStreakInfo && (
         <StreakInfoModal 
            days={user.streakDays || 0}
            onClose={() => setShowStreakInfo(false)}
         />
      )}

      {showOptions && (
          <OptionsSheet onClose={() => setShowOptions(false)} username={user.username} />
      )}

      {/* Unfollow Confirmation Modal */}
      {showUnfollowAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-8">
           <div className="bg-theme-card w-full max-w-xs rounded-2xl p-6 border border-theme-divider shadow-2xl text-center">
              <Avatar url={user.avatarUrl} size="lg" className="mx-auto mb-4" />
              <h3 className="font-bold text-lg text-theme-text mb-2">Unfollow @{user.username}?</h3>
              <p className="text-sm text-theme-secondary mb-6 leading-relaxed">
                 If you change your mind, you'll have to request to follow {user.displayName} again.
              </p>
              <div className="flex flex-col gap-3">
                 <button 
                   onClick={confirmUnfollow}
                   className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/10 hover:text-white transition-all"
                 >
                   Unfollow
                 </button>
                 <button 
                   onClick={() => setShowUnfollowAlert(false)}
                   className="w-full py-3 rounded-xl text-theme-text font-bold text-sm hover:bg-theme-bg transition-all"
                 >
                   Cancel
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Navigation & Action Bar */}
      <div className="relative h-14 w-full px-4 flex justify-between items-center z-20 pt-4">
         <div className="flex items-center gap-4">
             <div className="w-10">
               {onBack && <BackArrow onClick={onBack} />}
             </div>
             {!isOwnProfile && (
                 <span className="text-sm font-bold text-theme-text tracking-wide">@{user.username}</span>
             )}
         </div>
         
         <div className="flex items-center gap-2">
            {isOwnProfile ? (
               <>
                  {/* COINS PURSE - Only for own profile */}
                  <button 
                    onClick={onOpenStore}
                    className="h-10 px-3 rounded-full bg-theme-card border border-theme-divider flex items-center gap-2 hover:border-yellow-500/50 transition-all active:scale-95 group"
                  >
                    {/* Golden RateCoin Icon */}
                    <RateCoinIcon className="w-5 h-5" />
                    <span className="font-bold text-sm text-theme-text">{user.coins.toLocaleString()}</span>
                  </button>

                  <button 
                    onClick={onOpenSettings} 
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-theme-text"
                  >
                     {/* Minimalist Gear SVG */}
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.581-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                  </button>
               </>
            ) : (
                <button 
                    onClick={() => setShowOptions(true)}
                    className="w-10 h-10 flex items-center justify-center text-2xl font-bold rounded-full hover:bg-white/5 transition-colors text-theme-text"
                >
                    ⋮
                </button>
            )}
         </div>
      </div>

      <div className="px-4 relative z-10 mt-2">
        
        <div className="flex gap-4 mb-2 items-start">
           
           {/* LEFT: Avatar */}
           <div className="flex flex-col items-center w-auto shrink-0 min-w-[130px]">
              <Avatar url={user.avatarUrl} size="profile" border={true} />
           </div>

           {/* RIGHT: Name -> Score/Streak -> Stats */}
           <div className="flex-1 flex flex-col pt-1">
                 
                 {/* 1. Name */}
                 <h1 className="text-lg font-black text-theme-text leading-tight mb-3 truncate">
                    {user.displayName}
                    {user.isVerified && <span className="text-theme-accent ml-1 text-sm">✓</span>}
                 </h1>

                 {/* 2. Score & Streak Horizontal Widget (Separated by line, not boxed) */}
                 <div className="flex items-center mb-4">
                    {/* Main Score */}
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-brand-gradient leading-none tracking-tighter">
                        {user.averageScore.toFixed(1)}
                    </div>
                    
                    {/* Vertical Divider */}
                    <div className="w-px h-10 bg-theme-divider mx-4"></div>
                    
                    {/* Streak (Clickable) */}
                    <button 
                       onClick={() => setShowStreakInfo(true)}
                       className="flex items-center gap-2 group hover:opacity-80 transition-opacity cursor-pointer pl-1"
                    >
                        <div className="text-3xl animate-pulse group-hover:scale-110 transition-transform drop-shadow-sm text-theme-text">🔥</div>
                        <span className="text-xl font-black text-theme-text">{user.streakDays || 0} Days</span>
                    </button>
                 </div>

                 {/* 3. Stats Row */}
                 <div className="flex justify-between items-center w-full pr-1">
                    <div className="text-center">
                       <div className="font-bold text-lg text-theme-text leading-tight">{userCreatedPosts.length}</div>
                       <div className="text-[9px] text-theme-secondary uppercase">Post</div>
                    </div>
                    
                    <button 
                       className="text-center hover:opacity-70 transition-opacity active:scale-95"
                       onClick={onFollowersClick}
                    >
                       <div className="font-bold text-lg text-theme-text leading-tight">{user.followersCount.toLocaleString()}</div>
                       <div className="text-[9px] text-theme-secondary uppercase">Followers</div>
                    </button>
                    
                    <button 
                       className="text-center hover:opacity-70 transition-opacity active:scale-95"
                       onClick={onFollowingClick}
                    >
                       <div className="font-bold text-lg text-theme-text leading-tight">{user.followingCount.toLocaleString()}</div>
                       <div className="text-[9px] text-theme-secondary uppercase">Following</div>
                    </button>
                 </div>
           </div>
        </div>

        {/* Bio (Improved Typography) */}
        <div className="mt-4 mb-5 text-center mx-auto px-4 max-w-sm">
            <p className="text-theme-text/90 text-sm font-medium leading-relaxed tracking-wide line-clamp-3">
                {user.bio}
            </p>
        </div>

        {/* Action Buttons (Follow / Message) */}
        <div className="mb-4 flex gap-3">
             {!isOwnProfile && (
                 <>
                    <button 
                        onClick={handleFollowClick}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                            isFollowing 
                            ? 'bg-theme-bg text-theme-text border border-theme-divider hover:bg-theme-card' 
                            : 'bg-brand-gradient text-white shadow-soft-md'
                        }`}
                    >
                        {followRequestStatus === 'REQUESTING' ? 'Requested...' : (isFollowing ? 'Following' : 'Follow')}
                    </button>
                    <button 
                        onClick={onChat}
                        className="flex-1 bg-theme-bg text-theme-text border border-theme-divider py-2.5 rounded-xl text-xs font-bold hover:bg-theme-card transition-all shadow-sm"
                    >
                        Message
                    </button>
                 </>
             )}
             {isOwnProfile && (
                <>
                    <button 
                        onClick={onEditProfile}
                        className="flex-1 bg-theme-bg text-theme-text border border-theme-divider py-2.5 rounded-xl text-xs font-bold hover:bg-theme-card transition-all shadow-sm"
                    >
                        Edit Profile
                    </button>
                    <button 
                        onClick={handleVibeCheck}
                        className="flex-1 bg-theme-bg border border-theme-accent/50 text-theme-accent py-2.5 rounded-xl text-xs font-bold hover:bg-theme-accent hover:text-white transition-all shadow-sm flex items-center justify-center gap-1"
                    >
                        <span>✨</span> Vibe Check
                    </button>
                </>
             )}
        </div>

        {isContentLocked ? (
           <div className="mt-8 text-center text-theme-secondary p-8">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-xs">Follow this account to see full stats.</p>
           </div>
        ) : (
           <>
               {/* DIVIDER - Shown on both Own and Other profiles if unlocked */}
               <div className="border-t border-theme-divider w-full my-3 opacity-50"></div>

               {/* Describe User Button (Acts as Radar Title) */}
               <div className="mb-0 mt-6 flex justify-center relative z-10">
                   {isOwnProfile ? (
                       // Static Title Version for Own Profile
                       <div className="px-6 py-2 flex items-center justify-center gap-2 bg-theme-card rounded-full border border-theme-divider shadow-sm">
                            <span className="font-black flex items-center gap-0.5 text-sm text-theme-text tracking-wide">
                              <span>Describe</span>
                              <span className="text-theme-accent text-xs relative top-[0.5px]">★</span>
                              <span>Me</span>
                           </span>
                       </div>
                   ) : (
                       // Interactive Button Version for Other Profiles
                       <NeonButton 
                           onClick={onRateUser} 
                           glow={true} 
                           className="w-auto px-6 py-2 text-xs flex items-center justify-center gap-2 rounded-full shadow-lg !bg-theme-card !border-theme-divider !text-theme-text hover:!bg-theme-divider/80 hover:!text-theme-text"
                       >
                           <span className="font-black flex items-center gap-0.5 text-sm">
                              <span>Describe</span>
                              <span className="text-theme-accent text-xs relative top-[0.5px]">★</span>
                              <span>Me</span>
                           </span>
                       </NeonButton>
                   )}
               </div>

               {/* Radar Chart - MOVED UP from mt-8 to mt-4 */}
               <div className="w-full flex items-center justify-center mt-4 mb-4">
                  <div className="h-64 w-full max-w-sm">
                       <RadarChartComponent 
                         data={user.badgeAverages} 
                         theme={theme} 
                         // Updated: onAxisClick and onValueClick now pass the icon component along with text
                         onAxisClick={(label, score) => setRadarToast({ 
                             message: `${label}: ${score.toFixed(1)}`, 
                             icon: <BadgeIcon type={label} className="w-4 h-4 text-white" /> 
                         })}
                         onValueClick={(label, score) => setRadarToast({ 
                             message: `${label}: ${score.toFixed(1)} ${score === 5 ? '(Perfect)' : ''}`,
                             icon: <BadgeIcon type={label} className="w-4 h-4 text-white" />
                         })} 
                       />
                  </div>
               </div>
               
               {/* Content Tabs (Instagram Style SVG Icons) - INCREASED TOP MARGIN FOR BREATHING ROOM */}
               <div className="mt-2">
                  <div className="flex border-b border-theme-text/10 mb-1">
                     <TabButton 
                        id="POSTS" 
                        icon={
                           <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        } 
                     />
                     <TabButton 
                        id="REPOSTS" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                        } 
                     />
                     {isOwnProfile && (
                        <TabButton 
                           id="SAVED" 
                           icon={
                              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                           } 
                        />
                     )}
                     <TabButton 
                        id="EVOLUTION" 
                        icon={
                           <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        } 
                     />
                  </div>

                  {/* POSTS GRID */}
                  {activeTab === 'POSTS' && (
                     <div className="grid grid-cols-3 gap-0.5">
                        {userCreatedPosts.map(post => (
                        <div 
                           key={post.id} 
                           onClick={() => onPostClick && onPostClick(post)}
                           className="aspect-[3/4] bg-gray-900 relative group cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
                        >
                           <img src={post.mediaUrl} className="w-full h-full object-cover" alt="Post" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                              <span className="font-bold text-white text-xs">★ {post.averageRating.toFixed(1)}</span>
                           </div>
                        </div>
                        ))}
                        {userCreatedPosts.length === 0 && (
                           <div className="col-span-3 py-16 text-center">
                              <div className="text-xl mb-2 opacity-50">📷</div>
                              <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-400 text-2xl uppercase tracking-tighter pr-4 leading-normal">NO POSTS YET</span>
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'REPOSTS' && (
                     <div className="grid grid-cols-3 gap-0.5">
                        {repostedPosts.map(post => (
                        <div 
                           key={post.id} 
                           onClick={() => onPostClick && onPostClick(post)}
                           className="aspect-[3/4] bg-gray-900 relative group cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
                        >
                           <div className="absolute top-1 right-1 z-10 text-white drop-shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                           </div>
                           <img src={post.mediaUrl} className="w-full h-full object-cover grayscale-[30%]" alt="Post" />
                        </div>
                        ))}
                        {repostedPosts.length === 0 && (
                           <div className="col-span-3 py-16 text-center">
                              <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-400 text-2xl uppercase tracking-tighter pr-4 leading-normal">NO REPOSTS</span>
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'SAVED' && isOwnProfile && (
                     <div className="grid grid-cols-3 gap-0.5">
                        {savedPosts.map(post => (
                        <div 
                           key={post.id} 
                           onClick={() => onPostClick && onPostClick(post)}
                           className="aspect-[3/4] bg-gray-900 relative group cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
                        >
                           <div className="absolute top-1 right-1 z-10 text-theme-accent drop-shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                           </div>
                           <img src={post.mediaUrl} className="w-full h-full object-cover" alt="Post" />
                        </div>
                        ))}
                        {savedPosts.length === 0 && (
                           <div className="col-span-3 py-16 text-center">
                              <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-400 text-2xl uppercase tracking-tighter pr-4 leading-normal">NO SAVED POSTS</span>
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'EVOLUTION' && (
                     <div className="h-64 mt-4 px-2">
                        {user.ratingHistory && user.ratingHistory.length > 0 ? (
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={user.ratingHistory}>
                              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                              <XAxis 
                                 dataKey="date" 
                                 tick={{ fill: textColor, fontSize: 10, fontWeight: 500 }} 
                                 axisLine={false}
                                 tickLine={false}
                                 dy={10}
                              />
                              <YAxis 
                                 domain={[1, 5]} 
                                 tick={{ fill: textColor, fontSize: 10, fontWeight: 500 }} 
                                 axisLine={false}
                                 tickLine={false}
                                 width={20}
                              />
                              <Tooltip 
                                 contentStyle={{ 
                                 backgroundColor: tooltipBg, 
                                 border: `1px solid ${gridColor}`,
                                 borderRadius: '8px',
                                 color: textColor,
                                 fontSize: '12px'
                                 }}
                              />
                              <Line 
                                 type="monotone" 
                                 dataKey="score" 
                                 stroke="url(#gradientStroke)" 
                                 strokeWidth={3}
                                 dot={{ r: 3, fill: chartColor, strokeWidth: 2, stroke: tooltipBg }}
                                 activeDot={{ r: 5, fill: chartColor }}
                              />
                              <defs>
                                 <linearGradient id="gradientStroke" x1="0" y1="0" x2="1" y2="0">
                                 <stop offset="0%" stopColor={theme === 'dark' ? '#06B6D4' : '#0891B2'} />
                                 <stop offset="100%" stopColor={theme === 'dark' ? '#10B981' : '#059669'} />
                                 </linearGradient>
                              </defs>
                              </LineChart>
                           </ResponsiveContainer>
                        ) : (
                           <div className="h-full flex items-center justify-center text-center">
                              <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-400 text-lg uppercase tracking-tighter">NOT ENOUGH DATA</span>
                           </div>
                        )}
                     </div>
                  )}
               </div>
           </>
        )}
      </div>
    </div>
  );
};
