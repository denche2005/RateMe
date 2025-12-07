
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MOCK_USERS, MOCK_POSTS, MOCK_COMMENTS, MOCK_NOTIFICATIONS, MOCK_CHATS, MOCK_MESSAGES } from './constants';
import { User, Post, ViewState, Comment, Notification, ChatPreview, ChatMessage, BadgeType, UserListType, AppTheme } from './types';
import { Feed } from './components/Feed';
import { Profile } from './components/Profile';
import { RatingModal, RatingSummaryModal } from './components/RatingModal';
import { NeonButton, Avatar, RatingFlash, NotificationToast, Toast, BackArrow, DailyStreakModal } from './components/NeonComponents';
import { ChatsView } from './components/ChatsView';
import { EditProfileModal } from './components/EditProfileModal';
import { CommentsSheet } from './components/CommentsSheet';
import { ShareSheet } from './components/ShareSheet';
import { SettingsView } from './components/SettingsView';
import { UserListSheet } from './components/UserListSheet';
import { StoreSheet } from './components/StoreSheet';
import { PostInsightsSheet } from './components/PostInsightsSheet';
import { AuthScreen } from './components/AuthScreen';
import { AuthProvider, useAuth } from './services/AuthContext';
import { getUserById } from './services/userService';
import { createRating } from './services/ratingService';
import { createNotification } from './services/notificationService';
import { getFeedPosts, getUserPosts, uploadImage, createPost, getPostById } from './services/postService';
import { recalculatePostRating, recalculateUserScore } from './services/recalculateService';
import { PullToRefresh } from './components/PullToRefresh';





// --- Theme Configs ---
const THEMES = {
  NEON: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#3b82f6', gradient: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)' },
  EMERALD: { primary: '#10b981', secondary: '#059669', accent: '#10b981', gradient: 'linear-gradient(90deg, #059669 0%, #10b981 100%)' },
  SUNSET: { primary: '#f43f5e', secondary: '#f59e0b', accent: '#f43f5e', gradient: 'linear-gradient(90deg, #f59e0b 0%, #f43f5e 100%)' },
  LAVENDER: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#8b5cf6', gradient: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)' },
  MONO: { primary: '#ffffff', secondary: '#6b7280', accent: '#ffffff', gradient: 'linear-gradient(90deg, #6b7280 0%, #ffffff 100%)' },
};

// --- Sub-Components ---

const IntroAnimation = ({ onFinish }: { onFinish: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Timeline
    // 0s: Start App Logo
    // 1.8s: Fade out App Logo
    // 2.3s: Finish

    const t1 = setTimeout(() => {
      setFadeOut(true);
    }, 1800);

    const t2 = setTimeout(() => {
      onFinish();
    }, 2300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center">
        <div className="font-black flex items-center gap-1 text-5xl text-white tracking-wide scale-150 transform">
          <span className="animate-intro-logo-in" style={{ animationDelay: '0ms' }}>Rate</span>
          <span className="text-theme-accent text-4xl relative top-[2px] animate-star-reveal origin-center">★</span>
          <span className="animate-intro-logo-in" style={{ animationDelay: '100ms' }}>Me</span>
        </div>
      </div>
    </div>
  );
};

const NavButton = ({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 w-12 h-full transition-all duration-300 relative ${active ? 'text-theme-text' : 'text-theme-secondary hover:text-theme-text'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110 drop-shadow-md' : ''}`}>
      {icon}
    </div>
    {/* Dot Indicator */}
    {active && <div className="absolute bottom-3 w-1 h-1 bg-theme-text rounded-full animate-fade-in"></div>}
  </button>
);

const OnboardingView = ({ onConnectContacts, onSkip }: { onConnectContacts: () => void, onSkip: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);
    setTimeout(() => {
      onConnectContacts();
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-theme-bg text-center animate-fade-in">
      <div className="mb-8 relative">
        <div className="w-32 h-32 rounded-full bg-brand-gradient opacity-20 animate-pulse absolute inset-0 blur-2xl"></div>
        <div className="text-6xl relative z-10">📇</div>
      </div>
      <h1 className="text-3xl font-black mb-4 text-theme-text">Find Your Circle</h1>
      <p className="text-theme-secondary mb-8 leading-relaxed">
        RateMe works best with friends. Sync your contacts to see who's already here and rate them instantly.
      </p>

      <NeonButton
        onClick={handleConnect}
        className="w-full py-4 text-lg mb-4 flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        {isLoading ? 'Syncing...' : 'Sync Contacts'}
      </NeonButton>

      <button
        onClick={onSkip}
        className="text-theme-secondary text-sm font-bold hover:text-theme-text transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
};

const QuickRateView = ({
  queue,
  onRate,
  onSkipUser,
  onFinish
}: {
  queue: User[],
  onRate: (user: User) => void,
  onSkipUser: () => void,
  onFinish: () => void
}) => {
  const targetUser = queue[0];

  if (!targetUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-theme-bg text-center p-8 animate-fade-in">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-4 text-theme-text">All Caught Up!</h2>
        <p className="text-theme-secondary mb-8">You've rated all your contacts.</p>
        <NeonButton onClick={onFinish}>Enter RateMe</NeonButton>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-theme-bg relative animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <h2 className="text-xl text-transparent bg-clip-text bg-brand-gradient font-bold mb-8 uppercase tracking-widest">Quick Rate</h2>

        <div className="relative mb-6 group scale-110 transition-transform">
          <Avatar url={targetUser.avatarUrl} size="2xl" />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-theme-card px-4 py-1 rounded-full border border-theme-divider shadow-soft-md whitespace-nowrap z-10">
            <span className="font-bold text-theme-text">{targetUser.displayName}</span>
          </div>
        </div>

        <div className="mt-12 space-y-4 w-full max-w-xs">
          <NeonButton
            onClick={() => onRate(targetUser)}
            className="w-full text-lg py-4"
          >
            Rate Now ⚡️
          </NeonButton>

          <button
            onClick={onSkipUser}
            className="w-full py-3 text-theme-secondary font-bold hover:text-theme-text transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchView = ({
  users,
  onProfileClick,
  onBack
}: {
  users: User[],
  onProfileClick: (u: User) => void,
  onBack: () => void
}) => {
  const [tab, setTab] = useState<'CONTACTS' | 'GLOBAL' | 'RANKING'>('CONTACTS');
  const [query, setQuery] = useState('');

  // Filter Logic
  const filteredUsers = users.filter(u => {
    const matchesQuery = u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.displayName.toLowerCase().includes(query.toLowerCase());
    if (tab === 'CONTACTS') {
      // Mock contacts logic
      const isContact = ['u1', 'u2'].includes(u.id);
      return matchesQuery && isContact;
    }
    return matchesQuery;
  });

  // Ranking Logic: Sort by Highest Average Score
  const rankedUsers = [...users].sort((a, b) => b.averageScore - a.averageScore);

  return (
    <div className="h-full bg-theme-bg flex flex-col">
      <div className="p-4 pt-4 pb-2 bg-theme-bg z-10 sticky top-0 border-b border-theme-divider">
        <div className="flex items-center gap-4 mb-4">
          {/* Back Arrow */}
          <BackArrow onClick={onBack} />
          <h1 className="text-3xl font-black mb-0 text-theme-text">Discover</h1>
        </div>

        {tab !== 'RANKING' && (
          <div className="relative mb-6 animate-fade-in">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === 'CONTACTS' ? "Search contacts..." : "Search everyone..."}
              className="w-full bg-theme-card border border-theme-divider rounded-xl px-4 py-3 pl-10 text-theme-text focus:border-theme-accent focus:outline-none focus:shadow-sm transition-all placeholder-gray-400 font-medium tracking-wide"
            />
            <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={() => setTab('CONTACTS')}
            className={`flex-1 pb-3 font-bold text-xs transition-colors relative ${tab === 'CONTACTS' ? 'text-theme-accent' : 'text-theme-secondary'}`}
          >
            CONTACTS
            {tab === 'CONTACTS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-gradient"></div>}
          </button>
          <button
            onClick={() => setTab('GLOBAL')}
            className={`flex-1 pb-3 font-bold text-xs transition-colors relative ${tab === 'GLOBAL' ? 'text-theme-accent' : 'text-theme-secondary'}`}
          >
            GLOBAL
            {tab === 'GLOBAL' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-gradient"></div>}
          </button>
          <button
            onClick={() => setTab('RANKING')}
            className={`flex-1 pb-3 font-bold text-xs transition-colors relative ${tab === 'RANKING' ? 'text-theme-accent' : 'text-theme-secondary'}`}
          >
            RANKING
            {tab === 'RANKING' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-gradient"></div>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
        {tab === 'RANKING' ? (
          // --- RANKING VIEW (Cleaned up) ---
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-theme-secondary uppercase tracking-widest">Global Top 100</h2>
              <span className="text-xs bg-theme-card text-theme-accent px-2 py-0.5 rounded border border-theme-divider">Weekly</span>
            </div>
            {rankedUsers.map((u, idx) => {
              let rankColor = 'text-gray-500';
              let rankIcon = null;
              if (idx === 0) { rankColor = 'text-yellow-400'; rankIcon = '👑'; }
              if (idx === 1) { rankColor = 'text-gray-400'; rankIcon = '🥈'; }
              if (idx === 2) { rankColor = 'text-orange-400'; rankIcon = '🥉'; }

              return (
                <div key={u.id} onClick={() => onProfileClick(u)} className="bg-theme-card p-4 rounded-xl flex items-center justify-between border border-theme-divider shadow-soft-md cursor-pointer hover:border-theme-accent/30 transition-all active:scale-98">
                  <div className="flex items-center gap-4">
                    <div className={`text-xl font-black w-8 flex justify-center ${rankColor}`}>
                      {rankIcon || `#${idx + 1}`}
                    </div>
                    <Avatar url={u.avatarUrl} size="md" border={true} />
                    <div>
                      <div className="font-bold text-theme-text text-[15px]">{u.displayName}</div>
                      <div className="text-xs text-theme-secondary font-medium tracking-wide">@{u.username}</div>
                    </div>
                  </div>
                  <div className="text-xl font-black text-theme-text">
                    {u.averageScore.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // --- CONTACTS & GLOBAL VIEW ---
          <>
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-20 opacity-50 text-theme-secondary">
                <div className="text-4xl mb-2">🔭</div>
                <div className="text-center">No results found</div>
              </div>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} onClick={() => onProfileClick(u)} className="flex items-center gap-4 bg-theme-card p-3 rounded-xl border border-theme-divider cursor-pointer hover:border-theme-accent/30 transition-colors active:scale-98 shadow-sm">
                  <Avatar url={u.avatarUrl} size="md" border={true} />
                  <div className="flex-1">
                    <div className="font-bold text-theme-text text-[15px]">{u.displayName}</div>
                    <div className="text-xs text-theme-secondary font-medium tracking-wide">@{u.username}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-lg font-black text-transparent bg-clip-text bg-brand-gradient">{u.averageScore.toFixed(1)}</div>
                    <div className="text-[10px] text-theme-secondary uppercase">Avg</div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = ({ authenticatedUser }: { authenticatedUser: User | null }) => {
  const [showIntro, setShowIntro] = useState(true);

  // Theme State
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('light'); // Changed default to 'light'
  const [appTheme, setAppTheme] = useState<AppTheme>('NEON');
  const [ratingScale, setRatingScale] = useState<5 | 10 | 100>(5);

  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('ONBOARDING');
  const [navigationStack, setNavigationStack] = useState<ViewState[]>([]);

  // Data State - Merge authenticated user with mock users
  const initialUsers = authenticatedUser
    ? [authenticatedUser, ...MOCK_USERS.filter(u => u.id !== authenticatedUser.id)]
    : MOCK_USERS;
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [chatList, setChatList] = useState<ChatPreview[]>(MOCK_CHATS);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(MOCK_MESSAGES);

  // Persistence - Use authenticated user ID
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(authenticatedUser?.id || 'me');

  // Logic Maps
  const [userPostRatings, setUserPostRatings] = useState<Record<string, number>>({});
  const [userCooldowns, setUserCooldowns] = useState<Record<string, number>>({});

  // Derived Users - Use authenticatedUser as currentUser when available
  const currentUser = authenticatedUser || users.find(u => u.id === currentUserId) || users[0];
  const viewingUser = viewingUserId ? users.find(u => u.id === viewingUserId) || null : null;

  // New States for Saved and Reposts
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [repostedPosts, setRepostedPosts] = useState<Post[]>([]);
  const [activeChatTarget, setActiveChatTarget] = useState<string | null>(null);

  // Single Post Viewing State
  const [viewingPost, setViewingPost] = useState<Post | null>(null);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interaction State
  const [ratingTarget, setRatingTarget] = useState<{ type: 'user' | 'post', data: User | Post } | null>(null);
  const [lastRating, setLastRating] = useState<number | null>(null);
  const [quickRateQueue, setQuickRateQueue] = useState<User[]>([]);

  // Daily Poll State (Lifted to App)
  type PollResponse = { type: 'VOTE', choice: 'A' | 'B' } | { type: 'NOTE', text: string };
  const [dailyPollResponse, setDailyPollResponse] = useState<PollResponse | null>(null);

  // Modals & Sheets
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeSharePostId, setActiveSharePostId] = useState<string | null>(null);
  const [confirmPaymentModal, setConfirmPaymentModal] = useState<{ visible: boolean, cost: number, onConfirm: () => void } | null>(null);

  const [activeInsightPost, setActiveInsightPost] = useState<Post | null>(null);
  const [viewingRatingSummary, setViewingRatingSummary] = useState<Notification | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakReward, setStreakReward] = useState({ day: 0, points: 0 });
  const [hasShownStreak, setHasShownStreak] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);
  const [userListTarget, setUserListTarget] = useState<{ type: UserListType, users: User[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Initialization & Theme Engine ---
  useEffect(() => {
    const initializedUsers = MOCK_USERS.map(user => {
      const userPosts = MOCK_POSTS.filter(p => p.creatorId === user.id);
      if (userPosts.length === 0) return user;
      const totalScore = userPosts.reduce((acc, p) => acc + p.averageRating, 0);
      const avgScore = totalScore / userPosts.length;
      return { ...user, averageScore: avgScore, postsCount: userPosts.length };
    });
    setUsers(initializedUsers);
  }, []);

  // Ensure authenticated user is in users array
  useEffect(() => {
    if (authenticatedUser) {
      setUsers(prev => {
        const hasUser = prev.some(u => u.id === authenticatedUser.id);
        if (!hasUser) {
          return [authenticatedUser, ...prev];
        }
        return prev;
      });
    }
  }, [authenticatedUser]);

  // Load posts from Supabase (only once per user)
  const postsLoadedRef = useRef<string | null>(null);
  useEffect(() => {
    const loadRealPosts = async () => {
      console.log('[DEBUG] Load posts effect - authenticatedUser:', authenticatedUser?.id, authenticatedUser?.username);
      console.log('[DEBUG] postsLoadedRef.current:', postsLoadedRef.current);

      if (authenticatedUser && postsLoadedRef.current !== authenticatedUser.id) {
        postsLoadedRef.current = authenticatedUser.id;
        const realPosts = await getFeedPosts(50);
        console.log('[DEBUG] Loaded posts from Supabase:', realPosts.length, 'posts');
        console.log('[DEBUG] Posts:', realPosts);
        console.log('[DEBUG] Current users array length:', users.length);
        console.log('[DEBUG] Users:', users.map(u => ({ id: u.id, username: u.username })));

        if (realPosts.length > 0) {
          // Load creator profiles for all posts
          const creatorIds = [...new Set(realPosts.map(p => p.creatorId))];
          console.log('[DEBUG] Loading creator profiles for:', creatorIds);

          const creatorProfiles = await Promise.all(
            creatorIds.map(id => getUserById(id))
          );

          const validCreators = creatorProfiles.filter(p => p !== null) as User[];
          console.log('[DEBUG] Loaded', validCreators.length, 'creator profiles');

          // Add creators to users array if not already there
          setUsers(prev => {
            const existingIds = new Set(prev.map(u => u.id));
            const newCreators = validCreators.filter(c => !existingIds.has(c.id));
            if (newCreators.length > 0) {
              console.log('[DEBUG] Adding', newCreators.length, 'new creators to users array');
              return [...prev, ...newCreators];
            }
            return prev;
          });

          setPosts(realPosts);
          console.log('[DEBUG] Set posts state with', realPosts.length, 'posts');
        } else {
          setPosts([]); // Clear posts if no real posts
          console.log('[DEBUG] No posts found, cleared posts array');
        }
      }
    };
    loadRealPosts();
  }, [authenticatedUser, users]);

  useEffect(() => {
    const root = document.documentElement;
    const themeConfig = THEMES[appTheme];
    root.style.setProperty('--theme-primary', themeConfig.primary);
    root.style.setProperty('--theme-secondary', themeConfig.secondary);
    root.style.setProperty('--accent', themeConfig.accent);
    root.style.setProperty('--brand-gradient', themeConfig.gradient);

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
    };
    root.style.setProperty('--accent-rgb', hexToRgb(themeConfig.accent));
  }, [appTheme]);

  const calculateMultiplier = (streak: number) => 1 + (streak * 0.05);

  const awardCoins = (userId: string, baseAmount: number, reason: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const mult = calculateMultiplier(u.streakDays || 0);
        const finalAmount = Math.floor(baseAmount * mult);
        if (userId === currentUserId) {
          setToastMessage(`${reason}: +${finalAmount} RateCoins (${mult.toFixed(2)}x Boost)`);
        }
        return { ...u, coins: u.coins + finalAmount };
      }
      return u;
    }));
  };

  const handleBuyStoreItem = (item: { name: string, price: number }) => {
    if (currentUser.coins >= item.price) {
      setUsers(prev => prev.map(u => {
        if (u.id === currentUser.id) {
          return { ...u, coins: u.coins - item.price };
        }
        return u;
      }));
      setToastMessage(`Purchased ${item.name}! 🎉`);
    } else {
      setToastMessage(`Not enough RateCoins for ${item.name} 💸`);
    }
  };

  const handleClaimStreak = () => {
    setShowStreakModal(false);
    setUsers(prev => prev.map(u => {
      if (u.id === 'me') {
        return { ...u, streakDays: streakReward.day };
      }
      return u;
    }));
    awardCoins('me', streakReward.points, 'Streak Claimed');
  };

  const applyRatingToUser = (targetUserId: string, score: number, badges?: Record<string, number>) => {
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === targetUserId) {
        const newTotalRatings = u.totalRatings + 1;
        const newBadgeAverages = { ...u.badgeAverages };
        if (badges) {
          Object.entries(badges).forEach(([badgeName, badgeScore]) => {
            const currentBadgeAvg = newBadgeAverages[badgeName as BadgeType] || 0;
            const newAvg = ((currentBadgeAvg * u.totalRatings) + badgeScore) / newTotalRatings;
            newBadgeAverages[badgeName as BadgeType] = newAvg;
          });
        }
        return { ...u, totalRatings: newTotalRatings, badgeAverages: newBadgeAverages };
      }
      return u;
    }));
    setUserCooldowns(prev => ({ ...prev, [targetUserId]: Date.now() }));
  };

  const handleFeedRate = async (post: Post, score: number) => {
    const previousRating = userPostRatings[post.id];

    // Save rating to Supabase
    if (!previousRating) {
      try {
        const result = await createRating({
          raterId: currentUserId,
          targetId: post.id,
          targetType: 'post',
          value: score, // Keep decimal value (0.5, 1.0, 1.5, etc.)
        });

        if (result.success) {
          // TODO: Fix notification system to include targetUserId

          // Reload creator profile to get updated averageScore
          const creator = users.find(u => u.id === post.creatorId);
          if (creator) {
            const updatedCreator = await getUserById(creator.id);
            if (updatedCreator) {
              setUsers(prev => prev.map(u => u.id === creator.id ? updatedCreator : u));
            }
          }
        } else {
          console.warn('Rating failed (post may not exist in DB):', result.error);
        }
      } catch (error) {
        console.error('Error saving rating:', error);
      }
    }

    // Update local state for immediate UI feedback
    setPosts(prevPosts => {
      const updatedPosts = prevPosts.map(p => {
        if (p.id === post.id) {
          let newAvg = 0;
          let newCount = p.ratingCount;

          if (previousRating !== undefined) {
            const totalScore = (p.averageRating * p.ratingCount);
            newAvg = (totalScore - previousRating + score) / p.ratingCount;
          } else {
            newCount = p.ratingCount + 1;
            newAvg = ((p.averageRating * p.ratingCount) + score) / newCount;
          }

          // SYNC SINGLE VIEWING POST IF OPEN
          if (viewingPost && viewingPost.id === post.id) {
            setViewingPost({ ...p, averageRating: newAvg, ratingCount: newCount });
          }

          return { ...p, averageRating: newAvg, ratingCount: newCount };
        }
        return p;
      });

      return updatedPosts;
    });

    if (previousRating === undefined) {
      const creator = users.find(u => u.id === post.creatorId);
      if (creator) {
        setUsers(prev => prev.map(u => {
          if (u.id === creator.id) {
            const mult = calculateMultiplier(u.streakDays || 0);
            return { ...u, coins: u.coins + Math.floor(5 * mult) };
          }
          return u;
        }));
      }
      awardCoins(currentUserId, 10, 'Rated Post');

      // --- NEW STREAK LOGIC: TRIGGER ONLY ON FIRST RATING OF SESSION ---
      if (!hasShownStreak) {
        const currentStreak = currentUser.streakDays || 0;
        const newDay = currentStreak + 1;
        const basePoints = 50 * Math.pow(1.1, newDay - 1);
        setStreakReward({ day: newDay, points: Math.floor(basePoints) });

        // Delay showing the modal so it doesn't interrupt the rating animation
        setTimeout(() => {
          setShowStreakModal(true);
          setHasShownStreak(true);
        }, 1200);
      }
    }

    setUserPostRatings(prev => ({ ...prev, [post.id]: score }));
  };

  const handleNavigate = (view: ViewState) => {
    setNavigationStack(prev => [...prev, currentView]);
    setCurrentView(view);
    if (view === 'FEED' || view === 'SEARCH') {
      setViewingUserId(null);
    }
  };

  const handleBack = () => {
    if (currentView === 'CHATS' && activeChatTarget) {
      setActiveChatTarget(null);
      return;
    }

    if (navigationStack.length > 0) {
      const prevView = navigationStack[navigationStack.length - 1];
      setNavigationStack(prev => prev.slice(0, -1));
      setCurrentView(prevView);
      if (navigationStack.length === 1) {
        setViewingUserId(null);
      }
    } else {
      setCurrentView('FEED');
      setViewingUserId(null);
    }
  };

  const handleProfileClick = (user: User) => {
    setViewingUserId(user.id);
    handleNavigate('PROFILE');
  };

  const handlePostClick = (post: Post) => {
    setViewingPost(post);
    handleNavigate('POST_DETAILS');
  };

  const checkUserRateCooldown = (targetUser: User) => {
    const lastRated = userCooldowns[targetUser.id];
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    if (lastRated && (now - lastRated < oneWeek)) {
      setConfirmPaymentModal({
        visible: true,
        cost: 200,
        onConfirm: () => {
          if (currentUser.coins >= 200) {
            setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, coins: u.coins - 200 } : u));
            setConfirmPaymentModal(null);
            setRatingTarget({ type: 'user', data: targetUser });
          } else {
            setToastMessage("Not enough RateCoins! Need 200.");
            setConfirmPaymentModal(null);
          }
        }
      });
    } else {
      setRatingTarget({ type: 'user', data: targetUser });
    }
  };

  const handleRate = (target: { type: 'user' | 'post', data: User | Post }) => {
    if (target.type === 'user') {
      checkUserRateCooldown(target.data as User);
    } else {
      setRatingTarget(target);
    }
  };

  const handleFollowUser = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const isFollowing = u.isFollowedByCurrentUser;
        return { ...u, followersCount: isFollowing ? u.followersCount - 1 : u.followersCount + 1, isFollowedByCurrentUser: !isFollowing };
      }
      return u;
    }));

    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        const targetUser = users.find(target => target.id === userId);
        const isFollowing = targetUser?.isFollowedByCurrentUser;
        return { ...u, followingCount: isFollowing ? u.followingCount - 1 : u.followingCount + 1 };
      }
      return u;
    }));
  };

  const handleRateBack = (raterId: string) => {
    const user = users.find(u => u.id === raterId);
    if (user) {
      handleRate({ type: 'user', data: user });
      setActiveNotification(null);
    }
  };

  const handleSavePost = (post: Post) => {
    let newSavedIds = currentUser.savedPostIds || [];
    if (savedPosts.find(p => p.id === post.id)) {
      setSavedPosts(savedPosts.filter(p => p.id !== post.id));
      newSavedIds = newSavedIds.filter(id => id !== post.id);
    } else {
      setSavedPosts([post, ...savedPosts]);
      newSavedIds = [...newSavedIds, post.id];
    }
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, savedPostIds: newSavedIds } : u));
  };

  const handleRepost = (post: Post) => {
    let newRepostIds = currentUser.repostedPostIds || [];
    if (repostedPosts.find(p => p.id === post.id)) {
      setRepostedPosts(repostedPosts.filter(p => p.id !== post.id));
      newRepostIds = newRepostIds.filter(id => id !== post.id);
    } else {
      setRepostedPosts([post, ...repostedPosts]);
      newRepostIds = [...newRepostIds, post.id];
      setToastMessage("Reposted to your profile! 🔁");
    }
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, repostedPostIds: newRepostIds } : u));
  };

  const handleShareSend = (selectedIds: string[]) => {
    if (!activeSharePostId) return;
    setToastMessage(`Sent to ${selectedIds.length} ${selectedIds.length === 1 ? 'person' : 'people'}! ✈️`);
  };

  const handleLikeComment = (commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const alreadyLiked = likedCommentIds.includes(commentId);
        return { ...c, likes: alreadyLiked ? c.likes - 1 : c.likes + 1 };
      }
      return c;
    }));
    setLikedCommentIds(prev => {
      if (prev.includes(commentId)) {
        return prev.filter(id => id !== commentId);
      } else {
        return [...prev, commentId];
      }
    });
  };

  const submitRating = async (score: number, badges: Record<string, number>) => {
    if (ratingTarget && ratingTarget.type === 'user') {
      const targetUser = ratingTarget.data as User;

      // Save rating to Supabase with badges
      const result = await createRating({
        raterId: currentUserId,
        targetId: targetUser.id,
        targetType: 'user',
        value: score,
        badges: badges as any,
      });

      if (result.success) {
        // Create DESCRIBED notification
        await createNotification(targetUser.id, {
          type: 'DESCRIBED',
          raterId: currentUserId,
          raterName: currentUser.displayName,
          score: 0,
          emoji: '✨',
          badgeScores: badges as any,
        } as any);

        // Reload target user to get updated badge averages
        const updatedTarget = await getUserById(targetUser.id);
        if (updatedTarget) {
          setUsers(prev => prev.map(u => u.id === targetUser.id ? updatedTarget : u));
        }

        // Award coins
        awardCoins(currentUserId, 50, 'Vibe Update');
      }

      // Local state update
      applyRatingToUser(targetUser.id, score, badges);
    }
    setRatingTarget(null);
    if (currentView === 'QUICK_RATE') {
      setLastRating(score);
      setQuickRateQueue(prev => prev.slice(1));
    }
  };

  const handleConnectContacts = () => {
    const friends = users.filter(u => u.id !== 'me');
    setQuickRateQueue(friends);
    setCurrentView('QUICK_RATE');
  };

  const handleAddComment = (text: string) => {
    if (!activeCommentPostId) return;
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      postId: activeCommentPostId,
      userId: currentUser.id,
      text: text,
      timestamp: Date.now(),
      likes: 0
    };
    setComments([newComment, ...comments]);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      console.log('Uploading image to Supabase Storage...');

      // 1. Upload image to Supabase Storage
      const uploadResult = await uploadImage(file, currentUserId);

      if (!uploadResult.success || !uploadResult.url) {
        console.error('Failed to upload image:', uploadResult.error);
        alert('Failed to upload image. Please try again.');
        return;
      }

      console.log('Image uploaded successfully:', uploadResult.url);

      // 2. Create post in database
      const postResult = await createPost({
        creatorId: currentUserId,
        mediaUrl: uploadResult.url,
        mediaType: 'image',
        caption: 'Fresh upload from RateMe 📸',
      });

      if (!postResult.success || !postResult.post) {
        console.error('Failed to create post:', postResult.error);
        alert('Failed to create post. Please try again.');
        return;
      }

      console.log('Post created successfully:', postResult.post);

      // 3. Add post to local state immediately
      setPosts(prev => [postResult.post!, ...prev]);

      // 4. Update user's post count locally
      setUsers(prev => prev.map(u =>
        u.id === currentUserId ? { ...u, postsCount: u.postsCount + 1 } : u
      ));

      // 5. Award coins
      awardCoins(currentUserId, 100, 'Uploaded Post');

      // 6. Navigate to feed to see the new post
      handleNavigate('FEED');
      e.target.value = '';

      console.log('Post creation complete!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const handleOpenUserList = (type: UserListType, targetUser: User) => {
    let list: User[] = [];
    if (type === 'FOLLOWING') {
      list = users.filter(u => targetUser.friends?.includes(u.id) || u.id === 'u1' || u.id === 'u2');
    } else {
      list = users.filter(u => u.id !== targetUser.id && Math.random() > 0.5);
    }
    setUserListTarget({ type, users: list });
  };

  const isChatOpen = currentView === 'CHATS' && activeChatTarget !== null;
  const showNav = !isChatOpen && ['FEED', 'SEARCH', 'PROFILE', 'CHATS', 'POST_DETAILS'].includes(currentView);

  return (
    <div className={`w-full h-full ${themeMode === 'light' ? 'light-mode' : ''}`}>

      {showIntro && <IntroAnimation onFinish={() => setShowIntro(false)} />}

      <div className="fixed inset-0 w-full h-full bg-theme-bg text-theme-text font-sans flex flex-col overflow-hidden select-none transition-colors duration-300">

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

        <RatingFlash score={lastRating} />

        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

        <NotificationToast
          notification={activeNotification}
          currentUserId={currentUser.id}
          userFriends={currentUser.friends || []}
          onClose={() => setActiveNotification(null)}
          onRateBack={handleRateBack}
        />

        {showStreakModal && (
          <DailyStreakModal
            day={streakReward.day}
            reward={streakReward.points}
            onClose={handleClaimStreak}
          />
        )}

        {confirmPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-6">
            <div className="bg-theme-card w-full max-w-sm rounded-3xl p-6 border border-theme-accent/30 shadow-2xl text-center">
              <div className="text-4xl mb-3">⏳</div>
              <h2 className="text-xl font-black text-theme-text mb-2">Cooldown Active</h2>
              <p className="text-theme-secondary text-sm mb-6 leading-relaxed">
                You can only rate this person for free once a week.
                Wait <b>7 days</b> or pay to rate now.
              </p>
              <div className="flex flex-col gap-3">
                <NeonButton onClick={confirmPaymentModal.onConfirm} className="w-full">
                  Pay {confirmPaymentModal.cost} RateCoins
                </NeonButton>
                <button
                  onClick={() => setConfirmPaymentModal(null)}
                  className="text-theme-secondary font-bold text-sm hover:text-theme-text"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isStoreOpen && (
          <StoreSheet
            balance={currentUser.coins}
            onClose={() => setIsStoreOpen(false)}
            onBuyItem={handleBuyStoreItem}
          />
        )}

        {activeInsightPost && (
          <PostInsightsSheet
            post={activeInsightPost}
            onClose={() => setActiveInsightPost(null)}
            users={users}
          />
        )}

        {viewingRatingSummary && viewingRatingSummary.badgeScores && (
          <RatingSummaryModal
            raterName={viewingRatingSummary.raterName}
            badgeScores={viewingRatingSummary.badgeScores}
            onClose={() => setViewingRatingSummary(null)}
          />
        )}

        <div className={`flex-1 w-full relative overflow-hidden ${showNav ? 'pb-[60px]' : ''}`}>
          {currentView === 'ONBOARDING' && !showIntro && (
            <OnboardingView onConnectContacts={handleConnectContacts} onSkip={() => setCurrentView('FEED')} />
          )}

          {currentView === 'QUICK_RATE' && (
            <QuickRateView
              queue={quickRateQueue}
              onRate={(u) => handleRate({ type: 'user', data: u })}
              onSkipUser={() => setQuickRateQueue(prev => prev.slice(1))}
              onFinish={() => handleNavigate('FEED')}
            />
          )}

          {currentView === 'FEED' && (
            <Feed
              posts={posts}
              users={users}
              comments={comments}
              ratingScale={ratingScale}
              onRate={handleFeedRate}
              onDetailedRate={(post) => handleRate({ type: 'post', data: post })}
              onProfileClick={handleProfileClick}
              onCommentClick={(post) => setActiveCommentPostId(post.id)}
              onShareClick={(post) => setActiveSharePostId(post.id)}
              onSaveClick={handleSavePost}
              onRepostClick={handleRepost}
              onAnalyticsClick={setActiveInsightPost}
              currentUser={currentUser}
            />
          )}

          {currentView === 'POST_DETAILS' && viewingPost && (
            <Feed
              posts={[viewingPost]}
              users={users}
              comments={comments}
              ratingScale={ratingScale}
              onRate={handleFeedRate}
              onDetailedRate={(post) => handleRate({ type: 'post', data: post })}
              onProfileClick={handleProfileClick}
              onCommentClick={(post) => setActiveCommentPostId(post.id)}
              onShareClick={(post) => setActiveSharePostId(post.id)}
              onSaveClick={handleSavePost}
              onRepostClick={handleRepost}
              onAnalyticsClick={setActiveInsightPost}
              onBack={handleBack}
              currentUser={currentUser}
            />
          )}

          {currentView === 'SEARCH' && (
            <SearchView
              users={users}
              onProfileClick={handleProfileClick}
              onBack={handleBack}
            />
          )}

          {currentView === 'CHATS' && (
            <ChatsView
              users={users}
              notifications={notifications}
              posts={posts}
              chatList={chatList}
              messages={messages}
              setMessages={setMessages}
              setChatList={setChatList} // PASSED HERE
              onBack={handleBack}
              activeChatId={activeChatTarget}
              onOpenChat={(id) => setActiveChatTarget(id)}
              onProfileClick={handleProfileClick}
              onPostClick={handlePostClick}
              onNotificationClick={(n) => setViewingRatingSummary(n)}
              userResponse={dailyPollResponse}
              onRespond={(resp) => {
                // Handle Coin Reward Logic for Daily Poll
                if (!dailyPollResponse) {
                  setDailyPollResponse(resp);
                  awardCoins('me', 50, 'Daily Poll Answered');
                } else {
                  setDailyPollResponse(resp);
                }
              }}
            />
          )}

          {currentView === 'PROFILE' && (
            <Profile
              user={viewingUser || currentUser}
              isOwnProfile={!viewingUser || viewingUser.id === currentUser.id}
              allPosts={posts}
              savedPosts={savedPosts}
              repostedPosts={viewingUser ? [] : repostedPosts}
              onRateUser={() => handleRate({ type: 'user', data: viewingUser || currentUser })}
              onBack={handleBack}
              onEditProfile={() => setIsEditingProfile(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenStore={() => setIsStoreOpen(true)}
              onChat={() => {
                if (viewingUser) {
                  setActiveChatTarget(viewingUser.id);
                  handleNavigate('CHATS');
                } else {
                  handleNavigate('CHATS');
                }
              }}
              onFollow={() => handleFollowUser((viewingUser || currentUser).id)}
              onFollowersClick={() => handleOpenUserList('FOLLOWERS', viewingUser || currentUser)}
              onFollowingClick={() => handleOpenUserList('FOLLOWING', viewingUser || currentUser)}
              onPostClick={handlePostClick}
              theme={themeMode}
              onToggleTheme={() => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark')}
              viewerFriends={currentUser.friends}
            />
          )}
        </div>

        {ratingTarget && (
          <RatingModal
            targetName={ratingTarget.type === 'user' ? (ratingTarget.data as User).displayName : 'this post'}
            onClose={() => setRatingTarget(null)}
            onSubmit={submitRating}
          />
        )}

        {isEditingProfile && (
          <EditProfileModal
            user={currentUser}
            onClose={() => setIsEditingProfile(false)}
            onSave={(updatedUser) => {
              setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
            }}
          />
        )}

        {isSettingsOpen && (
          <SettingsView
            currentScale={ratingScale}
            isPrivate={currentUser.isPrivate || false}
            onScaleChange={setRatingScale}
            onPrivacyChange={(val) => {
              setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isPrivate: val } : u));
            }}
            onClose={() => setIsSettingsOpen(false)}
            currentTheme={appTheme}
            onThemeChange={setAppTheme}
            isDarkMode={themeMode === 'dark'}
            onToggleDarkMode={() => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark')}
            onLogout={() => {
              setToastMessage("Logged out (Mock)");
              setIsSettingsOpen(false);
            }}
          />
        )}

        {activeCommentPostId && (
          <CommentsSheet
            comments={comments.filter(c => c.postId === activeCommentPostId)}
            users={users}
            onClose={() => setActiveCommentPostId(null)}
            onAddComment={handleAddComment}
            onLikeComment={handleLikeComment}
            likedCommentIds={likedCommentIds}
          />
        )}

        {activeSharePostId && (
          <ShareSheet
            users={users}
            onClose={() => setActiveSharePostId(null)}
            onSend={handleShareSend}
          />
        )}

        {userListTarget && (
          <UserListSheet
            type={userListTarget.type}
            users={userListTarget.users}
            onClose={() => setUserListTarget(null)}
            onUserClick={handleProfileClick}
          />
        )}

        {showNav && (
          <div className="absolute bottom-0 w-full h-[60px] bg-theme-bg/95 backdrop-blur-md border-t border-theme-text/5 flex justify-around items-center px-6 z-40 pointer-events-auto">
            <NavButton
              active={currentView === 'FEED'}
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill={currentView === 'FEED' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={currentView === 'FEED' ? 0 : 2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>}
              onClick={() => handleNavigate('FEED')}
            />

            <NavButton
              active={currentView === 'SEARCH'}
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>}
              onClick={() => handleNavigate('SEARCH')}
            />

            <div className="relative top-0">
              <button
                className="w-10 h-10 rounded-full bg-brand-gradient shadow-soft-xl flex items-center justify-center text-white transform transition-transform active:scale-95 border border-white/20"
                onClick={triggerFileUpload}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>

            <NavButton
              active={currentView === 'CHATS'}
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill={currentView === 'CHATS' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={currentView === 'CHATS' ? 0 : 2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>}
              onClick={() => handleNavigate('CHATS')}
            />

            <NavButton
              active={currentView === 'PROFILE' && !viewingUserId}
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill={currentView === 'PROFILE' && !viewingUserId ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={currentView === 'PROFILE' && !viewingUserId ? 0 : 2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
              onClick={() => {
                setViewingUserId(null);
                handleNavigate('PROFILE');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
const AppWithAuth = () => {
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load user profile from Supabase when authenticated
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        setLoadingProfile(true);
        const profile = await getUserById(user.id);
        if (profile) {
          setUserProfile(profile);
        }
        setLoadingProfile(false);
      } else {
        setUserProfile(null);
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [user]);  // Re-run when user changes

  // Show loading while checking auth
  if (loading || (user && loadingProfile)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-theme-bg">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-star-reveal">⭐</div>
          <div className="text-theme-secondary">Loading...</div>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <AuthScreen onAuthComplete={() => window.location.reload()} />;
  }

  // Pass authenticated user to main app
  return <App authenticatedUser={userProfile} />;
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <AuthProvider>
    <AppWithAuth />
  </AuthProvider>
);
