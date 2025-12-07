
import { User, Post, BadgeType, ChatPreview, ChatMessage, Comment, Notification } from "./types";

// Helper to generate history (Simulating a running average evolution)
const generateHistory = (base: number) => {
  return [
    { date: 'Jan', score: base - 0.4 },
    { date: 'Feb', score: base - 0.2 },
    { date: 'Mar', score: base + 0.1 },
    { date: 'Apr', score: base - 0.3 },
    { date: 'May', score: base + 0.2 },
    { date: 'Jun', score: base },
  ];
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'neon_queen',
    displayName: 'Sarah Cyber',
    avatarUrl: 'https://picsum.photos/200/200?random=1',
    bio: 'Living in 2077. Rate my fit.',
    age: 24,
    nation: 'Japan',
    coins: 1200, 
    averageScore: 4.5,
    totalRatings: 0, // Reset to 0
    followersCount: 12500,
    followingCount: 420,
    postsCount: 86,
    isFollowedByCurrentUser: true, 
    badgeAverages: {
      [BadgeType.INTELLIGENCE]: 0,
      [BadgeType.CHARISMA]: 0,
      [BadgeType.AFFECTIONATE]: 0,
      [BadgeType.HUMOR]: 0,
      [BadgeType.ACTIVE]: 0,
      [BadgeType.EXTROVERTED]: 0
    },
    ratingHistory: generateHistory(4.5),
    isVerified: true,
    isPrivate: false,
    friends: ['me', 'u2'],
    streakDays: 12
  },
  {
    id: 'u2',
    username: 'code_ninja',
    displayName: 'Alex Dev',
    avatarUrl: 'https://picsum.photos/200/200?random=2',
    bio: 'Building the future.',
    age: 28,
    nation: 'USA',
    coins: 850, 
    averageScore: 3.9,
    totalRatings: 0, // Reset to 0
    followersCount: 3400,
    followingCount: 1200,
    postsCount: 42,
    isFollowedByCurrentUser: false,
    badgeAverages: {
      [BadgeType.INTELLIGENCE]: 0,
      [BadgeType.CHARISMA]: 0,
      [BadgeType.AFFECTIONATE]: 0,
      [BadgeType.HUMOR]: 0,
      [BadgeType.ACTIVE]: 0,
      [BadgeType.EXTROVERTED]: 0
    },
    ratingHistory: generateHistory(3.9),
    isPrivate: true, 
    friends: ['u1'],
    streakDays: 5
  },
  {
    id: 'u3',
    username: 'fitness_junkie',
    displayName: 'Mike Swole',
    avatarUrl: 'https://picsum.photos/200/200?random=3',
    bio: 'Gym is life. No days off.',
    age: 22,
    nation: 'Brazil',
    coins: 2000, 
    averageScore: 4.1,
    totalRatings: 0, // Reset to 0
    followersCount: 8900,
    followingCount: 150,
    postsCount: 312,
    isFollowedByCurrentUser: false,
    badgeAverages: {
      [BadgeType.INTELLIGENCE]: 0,
      [BadgeType.CHARISMA]: 0,
      [BadgeType.AFFECTIONATE]: 0,
      [BadgeType.HUMOR]: 0,
      [BadgeType.ACTIVE]: 0,
      [BadgeType.EXTROVERTED]: 0
    },
    ratingHistory: generateHistory(4.1),
    isPrivate: false,
    friends: [],
    streakDays: 45
  },
  {
    id: 'me',
    username: 'new_user',
    displayName: 'Guest User',
    avatarUrl: 'https://picsum.photos/200/200?random=100',
    bio: 'Just joined RateMe! Loving the vibe here.',
    age: 21,
    nation: 'Global',
    coins: 450, 
    averageScore: 4.2,
    totalRatings: 18,
    followersCount: 128,
    followingCount: 50,
    postsCount: 3,
    isFollowedByCurrentUser: false,
    badgeAverages: {
      [BadgeType.INTELLIGENCE]: 4.1,
      [BadgeType.CHARISMA]: 3.5,
      [BadgeType.AFFECTIONATE]: 4.8,
      [BadgeType.HUMOR]: 2.9,
      [BadgeType.ACTIVE]: 3.5,
      [BadgeType.EXTROVERTED]: 4.0
    },
    ratingHistory: generateHistory(4.2),
    isPrivate: false,
    friends: ['u1'],
    streakDays: 10 
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p_me_1',
    creatorId: 'me',
    mediaUrl: 'https://picsum.photos/600/1000?random=99',
    type: 'image',
    caption: 'My first post on RateMe! 🚀',
    averageRating: 4.1,
    ratingCount: 5,
    saveCount: 12,
    repostCount: 3
  },
  {
    id: 'p1',
    creatorId: 'u1',
    mediaUrl: 'https://picsum.photos/600/1000?random=10',
    type: 'image',
    caption: 'Neon nights in Tokyo 🌃 #cyberpunk',
    averageRating: 4.6,
    ratingCount: 15, // Lowered to make new ratings visible
    saveCount: 342,
    repostCount: 89
  },
  {
    id: 'p2',
    creatorId: 'u2',
    mediaUrl: 'https://picsum.photos/600/1000?random=11',
    type: 'image',
    caption: 'My new setup setup setup',
    averageRating: 4.2,
    ratingCount: 8,
    saveCount: 56,
    repostCount: 12
  },
  {
    id: 'p3',
    creatorId: 'u3',
    mediaUrl: 'https://picsum.photos/600/1000?random=12',
    type: 'image',
    caption: 'PR day! 315lbs easy.',
    averageRating: 4.0,
    ratingCount: 12,
    saveCount: 23,
    repostCount: 5
  }
];

export const MOCK_CHATS: ChatPreview[] = [
  {
    id: 'c1',
    userId: 'u1',
    lastMessage: 'Omg thanks for the rating! 💖',
    unreadCount: 2,
    timestamp: Date.now() - 100000
  },
  {
    id: 'c2',
    userId: 'u2',
    lastMessage: 'Yo, nice profile pic.',
    unreadCount: 0,
    timestamp: Date.now() - 5000000
  }
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'c1': [
    { id: 'm1', senderId: 'u1', text: 'Hey!', timestamp: Date.now() - 200000, isOwn: false },
    { id: 'm2', senderId: 'me', text: 'Hi Sarah! Love the vibe.', timestamp: Date.now() - 150000, isOwn: true },
    { id: 'm3', senderId: 'u1', text: 'Omg thanks for the rating! 💖', timestamp: Date.now() - 100000, isOwn: false }
  ],
  'c2': [
    { id: 'm1', senderId: 'u2', text: 'Yo, nice profile pic.', timestamp: Date.now() - 5000000, isOwn: false }
  ]
};

export const MOCK_COMMENTS: Comment[] = [
    { id: 'cm1', postId: 'p1', userId: 'u2', text: 'This lighting is insane 🔥', timestamp: Date.now() - 3600000, likes: 45 },
    { id: 'cm2', postId: 'p1', userId: 'u3', text: 'Sheeesh', timestamp: Date.now() - 7200000, likes: 12 },
    { id: 'cm3', postId: 'p1', userId: 'me', text: 'Love it!', timestamp: Date.now() - 1800000, likes: 2 },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n_new_1',
    type: 'RATING',
    raterId: 'u1',
    raterName: 'Sarah Cyber',
    score: 4.8,
    emoji: '🤩',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
    postId: 'p_me_1',
    postMediaUrl: 'https://picsum.photos/600/1000?random=99'
  },
  {
    id: 'n_new_2',
    type: 'DESCRIBED',
    raterId: 'u3',
    raterName: 'Mike Swole',
    score: 0,
    emoji: '💪',
    timestamp: Date.now() - 1000 * 60 * 20, // 20 mins ago
    badgeScores: { [BadgeType.ACTIVE]: 5.0, [BadgeType.EXTROVERTED]: 4.5, [BadgeType.CHARISMA]: 4.0 } as any
  },
  {
    id: 'n_new_3',
    type: 'DESCRIBED',
    raterId: 'u2',
    raterName: 'Alex Dev',
    score: 0,
    emoji: '🧠',
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    badgeScores: { [BadgeType.INTELLIGENCE]: 4.8, [BadgeType.HUMOR]: 3.5, [BadgeType.AFFECTIONATE]: 2.0 } as any
  },
  {
    id: 'n_rate_1',
    type: 'RATING',
    raterId: 'u3',
    raterName: 'Mike Swole',
    score: 4.2,
    emoji: '🔥',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    postId: 'p_me_1',
    postMediaUrl: 'https://picsum.photos/600/1000?random=99'
  },
  {
    id: 'n_desc_1',
    type: 'DESCRIBED',
    raterId: 'u1',
    raterName: 'Sarah Cyber',
    score: 0,
    emoji: '✨', 
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    badgeScores: { [BadgeType.INTELLIGENCE]: 4.0, [BadgeType.CHARISMA]: 4.5, [BadgeType.AFFECTIONATE]: 5.0 } as any
  },
];
