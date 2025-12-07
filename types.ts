
export enum BadgeType {
  INTELLIGENCE = 'Intelligence',
  CHARISMA = 'Charisma',
  AFFECTIONATE = 'Affectionate',
  HUMOR = 'Humor',
  ACTIVE = 'Active',
  EXTROVERTED = 'Extroverted'
}

export interface Rating {
  id: string;
  raterId: string; // Internal use only
  targetId: string;
  value: number; // 1-10
  badges: Partial<Record<BadgeType, number>>;
  timestamp: number;
}

export interface RatingHistoryPoint {
  date: string; // MM-DD
  score: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  age?: number;
  nation?: string;
  
  // Stats
  coins: number; // Formerly Reputation
  averageScore: number;
  totalRatings: number;
  
  // Social Graph
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByCurrentUser?: boolean; // New field to track relationship

  badgeAverages: Record<BadgeType, number>;
  ratingHistory: RatingHistoryPoint[]; // For Evolution Chart

  isVerified?: boolean;
  isPrivate?: boolean; // New Privacy Setting
  savedPostIds?: string[];
  repostedPostIds?: string[];
  friends?: string[]; // IDs of mutual follows/accepted followers
  streakDays?: number; // Daily streak count
}

export interface Post {
  id: string;
  creatorId: string;
  mediaUrl: string; // Video or Image URL
  type: 'image' | 'video';
  caption: string;
  averageRating: number;
  ratingCount: number;
  saveCount: number;   // New field
  repostCount: number; // New field
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isOwn?: boolean;
  type?: 'text' | 'post' | 'image'; // Added 'image'
  postId?: string; 
  mediaUrl?: string; // For images sent in chat
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
}

export interface ChatPreview {
  id: string;
  userId: string; // The other person
  lastMessage: string;
  unreadCount: number;
  timestamp: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  timestamp: number;
  likes: number;
}

export interface Notification {
  id: string;
  type: 'RATING' | 'DESCRIBED'; // Added DESCRIBED
  raterId: string; // Always present now (No anonymous)
  raterName: string; 
  score: number;
  emoji: string;
  timestamp: number;
  postMediaUrl?: string; // Optional: if it was a post rating
  postId?: string;
  // NEW: Store the specific breakdown for this notification
  badgeScores?: Record<BadgeType, number>; 
}

export type AppTheme = 'NEON' | 'EMERALD' | 'SUNSET' | 'LAVENDER' | 'MONO';

export type ViewState = 'ONBOARDING' | 'QUICK_RATE' | 'FEED' | 'SEARCH' | 'PROFILE' | 'CHATS' | 'POST_DETAILS';

export type UserListType = 'FOLLOWERS' | 'FOLLOWING';
