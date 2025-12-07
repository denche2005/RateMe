
import React, { useState, useRef, useEffect } from 'react';
import { Post, User, Comment } from '../types';
import { Avatar, BackArrow } from './NeonComponents';

interface FeedProps {
  posts: Post[];
  users: User[];
  comments: Comment[];
  ratingScale: 5 | 10 | 100;
  onRate: (post: Post, score: number) => void;
  onDetailedRate: (post: Post) => void;
  onProfileClick: (user: User) => void;
  onCommentClick: (post: Post) => void;
  onShareClick: (post: Post) => void;
  onSaveClick: (post: Post) => void;
  onRepostClick: (post: Post) => void;
  onAnalyticsClick?: (post: Post) => void;
  onBack?: () => void;
  currentUser?: User;
}

interface FeedPostProps {
  post: Post;
  user: User;
  commentCount: number;
  maxScore: number;
  onRate: (score: number) => void;
  onDetailedRate: () => void;
  onProfileClick: () => void;
  onCommentClick: () => void;
  onShareClick: () => void;
  onSaveClick: () => void;
  onRepostClick: () => void;
  onAnalyticsClick?: () => void;
  currentUser?: User;
}

const getMoodEmoji = (score: number, maxScore: number) => {
  const percentage = score / maxScore;
  if (percentage >= 0.98) return '👑';
  if (percentage >= 0.9) return '🐐';
  if (percentage >= 0.8) return '🔥';
  if (percentage >= 0.6) return '🙂';
  if (percentage >= 0.4) return '😐';
  return '💀';
};

// Returns color based on score to dynamically style the text
const getScoreColor = (score: number, maxScore: number) => {
  const percentage = score / maxScore;
  const hue = percentage * 180; // Red (0) to Cyan (180)
  return `hsl(${hue}, 90%, 60%)`;
};

const FeedPost: React.FC<FeedPostProps> = ({
  post,
  user,
  commentCount,
  maxScore,
  onRate,
  onDetailedRate,
  onProfileClick,
  onCommentClick,
  onShareClick,
  onSaveClick,
  onRepostClick,
  onAnalyticsClick,
  currentUser
}) => {
  const [sliderValue, setSliderValue] = useState(maxScore / 2);

  const [isSaved, setIsSaved] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [localSaveCount, setLocalSaveCount] = useState(post.saveCount || 0);
  const [localRepostCount, setLocalRepostCount] = useState(post.repostCount || 0);

  const isOwnPost = currentUser && currentUser.id === post.creatorId;

  useEffect(() => {
    if (currentUser) {
      setIsSaved(currentUser.savedPostIds?.includes(post.id) || false);
      setIsReposted(currentUser.repostedPostIds?.includes(post.id) || false);
    }
  }, [currentUser, post.id]);

  const [isRepostAnimating, setIsRepostAnimating] = useState(false);
  const [flash, setFlash] = useState<{ visible: boolean, score: number, emoji: string, left: number } | null>(null);

  const step = maxScore === 100 ? 1 : 0.5;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(parseFloat(e.target.value));
  };

  const handleCommit = () => {
    const emoji = getMoodEmoji(sliderValue, maxScore);
    const percentage = (sliderValue / maxScore) * 100;

    setFlash({
      visible: true,
      score: sliderValue,
      emoji: emoji,
      left: percentage
    });

    // Reduced delay to 400ms as requested
    setTimeout(() => {
      onRate(sliderValue);
      setFlash(null);
    }, 400);
  };

  const handleSaveAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isSaved;
    setIsSaved(newState);
    setLocalSaveCount(prev => newState ? prev + 1 : prev - 1);
    onSaveClick();
  };

  const handleRepostAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isReposted;
    setIsReposted(newState);
    if (newState) {
      setIsRepostAnimating(true);
      setTimeout(() => setIsRepostAnimating(false), 600);
      setLocalRepostCount(prev => prev + 1);
    } else {
      setLocalRepostCount(prev => prev - 1);
    }
    onRepostClick();
  };

  // Logic: 0 to 1 ratio
  const ratio = sliderValue / maxScore;

  // Style: Use brand gradient.
  const sliderStyle = {
    backgroundImage: `var(--brand-gradient)`,
    backgroundSize: `calc(16px + (100% - 32px) * ${ratio}) 100%`,
    backgroundRepeat: 'no-repeat',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Empty track color
    height: '8px',
    borderRadius: '999px',
    margin: '0 8px', // Compensate for container padding/visual balance
    cursor: 'pointer'
  };

  const scoreColor = getScoreColor(sliderValue, maxScore);

  // Water Fill Calculation
  const fillPercentage = Math.min(100, Math.max(0, (post.averageRating / maxScore) * 100));

  return (
    <div className="h-full w-full snap-start relative flex flex-col bg-black">
      <div className="flex-1 relative overflow-hidden">
        {post.type === 'video' ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-500">
            <div className="text-6xl mb-4 opacity-50">▶️</div>
            <span className="text-sm uppercase tracking-widest opacity-50">Video Content</span>
          </div>
        ) : (
          <img
            src={post.mediaUrl}
            alt="Post"
            className="w-full h-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90 pointer-events-none" />

        <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none pb-6 px-4">
          <div className="flex items-end justify-between w-full h-full">

            {/* Changed mr-4 to mr-1 to extend the width closer to the buttons */}
            <div className="flex flex-col gap-2 flex-1 mr-1 pointer-events-auto min-w-0">
              <div className="pl-1">
                <p className="text-white/95 text-sm font-medium leading-relaxed tracking-wide drop-shadow-sm line-clamp-2">
                  {post.caption}
                </p>
              </div>

              <div className="flex items-end gap-3">
                <div className="cursor-pointer shrink-0 pb-1 relative" onClick={onProfileClick}>
                  <Avatar url={user.avatarUrl} size="md" border={true} />
                  <div className="absolute -bottom-1 -right-1 bg-black/80 backdrop-blur-sm border border-theme-accent rounded-full px-1.5 py-0.5 shadow-md flex items-center justify-center min-w-[24px]">
                    <span className="text-[10px] font-black text-white">{user.averageScore.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex-1 flex items-center gap-3 relative pb-1 min-w-0">
                  <div className={`text-center transition-all duration-200 w-12 shrink-0 ${sliderValue === maxScore ? 'scale-110' : ''}`}>
                    <span
                      className="font-black leading-none drop-shadow-lg"
                      style={{ color: scoreColor, fontSize: maxScore === 100 ? '1.5rem' : '2rem' }}
                    >
                      {sliderValue.toFixed(maxScore === 100 ? 0 : 1)}
                    </span>
                  </div>

                  <div className="flex-1 relative h-12 flex items-center bg-white/10 backdrop-blur-md rounded-full px-1 border border-white/10 shadow-lg min-w-0">
                    {flash && flash.visible && (
                      <div
                        className="absolute bottom-full mb-4 z-50 animate-pop-up pointer-events-none"
                        style={{ left: `${flash.left}%` }}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-5xl drop-shadow-2xl filter">{flash.emoji}</span>
                          <span className="text-3xl font-black text-white drop-shadow-lg stroke-black">
                            {flash.score.toFixed(maxScore === 100 ? 0 : 1)}
                          </span>
                        </div>
                      </div>
                    )}

                    <input
                      type="range"
                      min="0"
                      max={maxScore}
                      step={step}
                      value={sliderValue}
                      onChange={handleSliderChange}
                      onMouseUp={handleCommit}
                      onTouchEnd={handleCommit}
                      className="star-slider w-full"
                      style={sliderStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 pb-2 shrink-0 pointer-events-auto items-center">

              {/* STATIC WAVY WATER BUBBLE SCORE LOGO */}
              <div className="flex flex-col items-center gap-1 mb-2 animate-fade-in group cursor-default">
                <div className="w-12 h-12 rounded-full relative overflow-hidden bg-gray-900/60 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-2 ring-white/20 transition-transform transform group-hover:scale-105">

                  {/* Fill Container */}
                  <div
                    className="absolute bottom-0 left-0 w-full transition-all duration-700 ease-out flex flex-col justify-end"
                    style={{ height: `${fillPercentage}%` }}
                  >
                    {/* Static Wavy Top (SVG) */}
                    {/* Changed: Added -mb-1 to pull the solid block up slightly to cover the gap */}
                    <div className="w-full h-2 relative -mb-[1px] z-10 block">
                      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full text-[var(--theme-primary)] fill-current block" style={{ display: 'block' }} stroke="none">
                        <path d="M0 10 Q 25 20 50 10 T 100 10 V 20 H 0 Z" stroke="none" />
                      </svg>
                    </div>
                    {/* Solid Fill Block */}
                    <div className="w-full flex-1 bg-[var(--theme-primary)]"></div>
                  </div>

                  {/* Score Text */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <span className="font-black text-white text-lg tracking-tighter drop-shadow-md">
                      {post.averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-black text-white/90 uppercase tracking-widest drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm mt-1">AVG</span>
              </div>

              {isOwnPost && onAnalyticsClick && (
                <div className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform group" onClick={(e) => { e.stopPropagation(); onAnalyticsClick(); }}>
                  <div className="drop-shadow-lg text-white group-hover:text-gray-200 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"></line>
                      <line x1="12" y1="20" x2="12" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-white drop-shadow-md">Insights</span>
                </div>
              )}

              <div className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform group" onClick={(e) => { e.stopPropagation(); onCommentClick(); }}>
                <div className="drop-shadow-lg text-white group-hover:text-gray-200 transition-colors">
                  {/* Filled Comment Icon (Speech Bubble) */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">{commentCount}</span>
              </div>

              <div className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform group" onClick={handleSaveAction}>
                <div className={`drop-shadow-lg transition-colors ${isSaved ? 'text-theme-accent' : 'text-white group-hover:text-gray-200'}`}>
                  {/* Filled Save Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "currentColor"} stroke="none">
                    <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">{localSaveCount}</span>
              </div>

              <div className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform group" onClick={handleRepostAction}>
                <div className={`drop-shadow-lg transition-colors ${isReposted ? 'text-theme-accent' : 'text-white group-hover:text-gray-200'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isRepostAnimating ? 'animate-spin' : ''}`}>
                    <path d="M17 1l4 4-4 4"></path>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <path d="M7 23l-4-4 4-4"></path>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">{localRepostCount}</span>
              </div>

              <div className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform group" onClick={(e) => { e.stopPropagation(); onShareClick(); }}>
                <div className="drop-shadow-lg text-white group-hover:text-gray-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 transform -rotate-12">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">Share</span>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export const Feed: React.FC<FeedProps> = ({
  posts,
  users,
  comments,
  ratingScale,
  onRate,
  onDetailedRate,
  onProfileClick,
  onCommentClick,
  onShareClick,
  onSaveClick,
  onRepostClick,
  onAnalyticsClick,
  onBack,
  currentUser
}) => {
  const feedRef = useRef<HTMLDivElement>(null);

  const handlePostRate = (index: number, post: Post, score: number) => {
    onRate(post, score);

    // Auto Scroll to next post with a slight delay for better UX
    setTimeout(() => {
      if (feedRef.current) {
        const nextIndex = index + 1;
        if (nextIndex < posts.length) {
          const height = feedRef.current.clientHeight;
          feedRef.current.scrollTo({
            top: nextIndex * height,
            behavior: 'smooth'
          });
        }
      }
    }, 300); // 300ms delay to let user see the rating interaction
  };

  return (
    <div className="h-full w-full relative bg-black">
      {onBack && (
        <div className="absolute top-4 left-4 z-50">
          <BackArrow onClick={onBack} className="text-white border-white/20 bg-black/20" />
        </div>
      )}

      {/* Snap Scroll Container */}
      <div ref={feedRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
        {posts.map((post, index) => {
          const user = users.find(u => u.id === post.creatorId);
          if (!user) return null;

          const postComments = comments.filter(c => c.postId === post.id);

          return (
            <div key={post.id} className="h-full w-full snap-start">
              <FeedPost
                post={post}
                user={user}
                commentCount={postComments.length}
                maxScore={ratingScale}
                onRate={(score) => handlePostRate(index, post, score)}
                onDetailedRate={() => onDetailedRate(post)}
                onProfileClick={() => onProfileClick(user)}
                onCommentClick={() => onCommentClick(post)}
                onShareClick={() => onShareClick(post)}
                onSaveClick={() => onSaveClick(post)}
                onRepostClick={() => onRepostClick(post)}
                onAnalyticsClick={onAnalyticsClick ? () => onAnalyticsClick(post) : undefined}
                currentUser={currentUser}
              />
            </div>
          );
        })}
        {posts.length === 0 && (
          <div className="h-full w-full flex items-center justify-center text-white/50">
            No posts to show.
          </div>
        )}
      </div>
    </div>
  );
};
