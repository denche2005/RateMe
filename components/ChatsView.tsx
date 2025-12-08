
import React, { useState, useEffect, useRef } from 'react';
import { ChatPreview, ChatMessage, User, Notification, Post, BadgeType } from '../types';
import { Avatar, BackArrow, BadgeIcon, ScoreBadge, NeonButton } from './NeonComponents';
import { searchUsers, getUserConversations, getConversationMessages, sendMessage, getOrCreateConversation, markMessagesAsRead, Conversation } from '../services/messageService';

type PollResponse = { type: 'VOTE', choice: 'A' | 'B' } | { type: 'NOTE', text: string };

interface Props {
  users: User[];
  notifications: Notification[];
  posts: Post[];
  currentUserId: string;
  onBack: () => void;
  onProfileClick: (user: User) => void;
  onPostClick?: (post: Post) => void;
  onNotificationClick?: (notification: Notification) => void;
  userResponse: PollResponse | null;
  onRespond: (resp: PollResponse) => void;
}

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export const ChatsView: React.FC<Props> = ({
  users,
  notifications,
  posts,
  currentUserId,
  onBack,
  onProfileClick,
  onPostClick,
  onNotificationClick,
  userResponse,
  onRespond
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'MESSAGES' | 'ACTIVITY'>('MESSAGES');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Active chat state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Daily Poll mock data
  const dailyQuestion = {
    question: "Messi or Cristiano? ⚽️",
    optionA: "Messi 🇦🇷",
    optionB: "Cristiano 🇵🇹",
    friendAnswers: [
      { userId: 'u1', type: 'VOTE', choice: 'A', text: "Leo 🐐" },
      { userId: 'u2', type: 'NOTE', text: "Waiting for the weekend 😴" },
      { userId: 'u3', type: 'VOTE', choice: 'B', text: "Siuuuu" }
    ]
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [currentUserId]);

  // Search users
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        const results = await searchUsers(searchQuery, currentUserId);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, currentUserId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
      markMessagesAsRead(activeConversationId, currentUserId);
    }
  }, [activeConversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setLoadingConversations(true);
    const convs = await getUserConversations(currentUserId);
    setConversations(convs);
    setLoadingConversations(false);
  };

  const loadMessages = async (conversationId: string) => {
    const msgs = await getConversationMessages(conversationId);
    setMessages(msgs);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleUserClick = async (userId: string) => {
    // Get or create conversation
    const result = await getOrCreateConversation(currentUserId, userId);
    if (result.success && result.conversationId) {
      setActiveConversationId(result.conversationId);
      setSearchQuery('');
      setSearchResults([]);
      // Reload conversations to show new one
      loadConversations();
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConversationId || sendingMessage) return;

    setSendingMessage(true);
    const result = await sendMessage(activeConversationId, currentUserId, inputText);

    if (result.success && result.message) {
      setMessages(prev => [...prev, result.message!]);
      setInputText('');
      // Reload conversations to update last message
      loadConversations();
    }

    setSendingMessage(false);
  };

  const handleBack = () => {
    if (activeConversationId) {
      setActiveConversationId(null);
      setMessages([]);
    } else {
      onBack();
    }
  };

  // If viewing a conversation
  if (activeConversationId) {
    const conversation = conversations.find(c => c.id === activeConversationId);

    return (
      <div className="h-full flex flex-col bg-theme-bg">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-theme-divider bg-theme-card">
          <button onClick={handleBack} className="text-theme-text">
            <BackArrow />
          </button>
          <Avatar url={conversation?.other_user_avatar || ''} size="sm" />
          <div className="flex-1">
            <p className="font-bold text-theme-text">{conversation?.other_user_name}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwn
                    ? 'bg-theme-accent text-white'
                    : 'bg-theme-card text-theme-text border border-theme-divider'
                  }`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-theme-divider bg-theme-card">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Message..."
              className="flex-1 bg-theme-bg border border-theme-divider rounded-full px-4 py-2 text-theme-text placeholder-theme-secondary focus:outline-none focus:border-theme-accent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || sendingMessage}
              className="text-theme-accent font-bold disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className="h-full flex flex-col bg-theme-bg">
      {/* Header with Back */}
      <div className="flex items-center gap-3 p-4 border-b border-theme-divider bg-theme-card">
        <button onClick={onBack} className="text-theme-text">
          <BackArrow />
        </button>
        <h1 className="text-xl font-bold text-theme-text">Messages</h1>
      </div>

      {/* Tabs: Messages / Activity */}
      <div className="flex border-b border-theme-divider bg-theme-card">
        <button
          onClick={() => setActiveTab('MESSAGES')}
          className={`flex-1 py-3 font-bold text-sm transition-colors relative ${activeTab === 'MESSAGES' ? 'text-theme-text' : 'text-theme-secondary'
            }`}
        >
          Messages
          {activeTab === 'MESSAGES' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-text" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ACTIVITY')}
          className={`flex-1 py-3 font-bold text-sm transition-colors relative ${activeTab === 'ACTIVITY' ? 'text-theme-text' : 'text-theme-secondary'
            }`}
        >
          Activity
          {activeTab === 'ACTIVITY' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-text" />
          )}
        </button>
      </div>

      {activeTab === 'MESSAGES' ? (
        <>
          {/* Search Bar */}
          <div className="p-3 bg-theme-card border-b border-theme-divider">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-theme-bg border border-theme-divider rounded-full pl-10 pr-4 py-2 text-sm text-theme-text placeholder-theme-secondary focus:outline-none focus:border-theme-accent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-3 right-3 mt-2 bg-theme-card border border-theme-divider rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleUserClick(result.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-theme-bg transition-colors"
                  >
                    <Avatar url={result.avatar_url} size="sm" />
                    <div className="flex-1 text-left">
                      <p className="font-bold text-theme-text text-sm">{result.display_name}</p>
                      <p className="text-xs text-theme-secondary">@{result.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Daily Polls Section */}
          <div className="p-3 bg-theme-card border-b border-theme-divider">
            <p className="text-xs font-bold text-theme-secondary uppercase tracking-wide mb-2">Daily Polls</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {dailyQuestion.friendAnswers.map((answer, idx) => {
                const user = users.find(u => u.id === answer.userId);
                if (!user) return null;

                return (
                  <div key={idx} className="flex-shrink-0">
                    <div className="relative">
                      <Avatar url={user.avatarUrl} size="md" border />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-theme-accent rounded-full flex items-center justify-center text-xs">
                        {answer.type === 'VOTE' ? '✓' : '📝'}
                      </div>
                    </div>
                    <p className="text-xs text-theme-secondary text-center mt-1 max-w-[60px] truncate">
                      {user.displayName.split(' ')[0]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center px-8">
                <p className="text-theme-secondary text-sm">No messages yet</p>
                <p className="text-theme-secondary text-xs mt-1">Search for users to start chatting</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleConversationClick(conv.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-theme-card transition-colors border-b border-theme-divider"
                >
                  <div className="relative">
                    <Avatar url={conv.other_user_avatar || ''} size="md" />
                    {conv.unread_count! > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-theme-text text-sm">{conv.other_user_name}</p>
                    <p className="text-xs text-theme-secondary truncate">
                      {conv.last_message_text || 'Start a conversation'}
                    </p>
                  </div>
                  <div className="text-xs text-theme-secondary">
                    {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        // Activity Tab (Notifications)
        <div className="flex-1 overflow-y-auto px-2 pt-2">
          {notifications.map(notif => {
            const user = users.find(u => u.id === notif.raterId);
            const isDescribed = notif.type === 'DESCRIBED';
            const isComment = notif.type === 'COMMENT';
            const isReply = notif.type === 'REPLY';

            return (
              <div
                key={notif.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-theme-text/5 transition-colors group mb-2 border border-theme-divider/50"
              >
                <div
                  onClick={() => user && onProfileClick(user)}
                  className="relative cursor-pointer hover:scale-105 transition-transform"
                >
                  <Avatar url={user ? user.avatarUrl : ''} size="md" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-gradient rounded-full flex items-center justify-center text-[10px] text-white shadow-sm border border-theme-bg">
                    {isDescribed ? '✨' : (isComment || isReply) ? '💬' : '★'}
                  </div>
                </div>

                <div className="flex-1 cursor-pointer" onClick={() => {
                  if (isDescribed && onNotificationClick) {
                    onNotificationClick(notif);
                  }
                }}>
                  <p className="text-sm text-theme-text">
                    <span className="font-bold">{notif.raterName}</span>
                    {isDescribed ? ' described you!' :
                      isReply ? ' replied to you!' :
                        isComment ? ' commented on your post!' :
                          notif.type === 'SAVED' ? ' saved your post!' :
                            notif.type === 'REPOSTED' ? ' reposted your post!' :
                              ' rated your post!'}
                  </p>
                  <span className="text-[10px] text-theme-secondary">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isDescribed ? (
                  <div onClick={() => onProfileClick(users.find(u => u.id === notif.raterId) || user!)} className="cursor-pointer hover:scale-105 transition-transform">
                    <BadgeIcon type={BadgeType.CHARISMA} className="w-10 h-10 text-theme-accent drop-shadow-sm" />
                  </div>
                ) : (
                  <div onClick={() => {
                    if (notif.postId && onPostClick) {
                      const post = posts.find(p => p.id === notif.postId);
                      if (post) onPostClick(post);
                    }
                  }} className="relative cursor-pointer hover:scale-105 transition-transform">
                    {notif.postMediaUrl ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-theme-divider">
                        <img src={notif.postMediaUrl} alt="Post" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-theme-card border border-theme-divider flex items-center justify-center">
                        <span className="text-lg">📷</span>
                      </div>
                    )}
                    {(isComment || isReply) ? (
                      <div className="absolute -bottom-1 -left-1 bg-theme-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-[12px] border-2 border-theme-bg">
                        💬
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -left-1 bg-brand-gradient text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold border-2 border-theme-bg">
                        {notif.score.toFixed(1)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
