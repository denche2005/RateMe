
import React, { useState, useEffect, useRef } from 'react';
import { ChatPreview, ChatMessage, User, Notification, Post, BadgeType } from '../types';
import { Avatar, BackArrow, BadgeIcon, ScoreBadge, NeonButton } from './NeonComponents';
import { searchUsers, getUserConversations, getConversationMessages, sendMessage, getOrCreateConversation, markMessagesAsRead, Conversation } from '../services/messageService';
import { getTodaysPoll, getFriendResponses, getMyResponse, submitPollResponse, DailyPoll, PollResponse as PollResponseType } from '../services/pollService';
import { supabase } from '../services/supabaseClient';

type PollResponse = { type: 'VOTE', choice: 'A' | 'B' } | { type: 'NOTE', text: string };

interface Props {
  users: User[];
  notifications: Notification[];
  posts: Post[];
  currentUserId: string;
  currentUser: User;
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
  currentUser,
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

  // Swipe to reply state
  const [swipingMessageId, setSwipingMessageId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  // Daily Poll state
  const [todaysPoll, setTodaysPoll] = useState<DailyPoll | null>(null);
  const [myResponse, setMyResponse] = useState<PollResponseType | null>(null);
  const [friendResponses, setFriendResponses] = useState<PollResponseType[]>([]);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollModalTab, setPollModalTab] = useState<'POLL' | 'NOTE'>('POLL');
  const [noteText, setNoteText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Real-time message subscription
  useEffect(() => {
    if (!activeConversationId) return;

    console.log('[REALTIME] Subscribing to conversation:', activeConversationId);

    const channel = supabase
      .channel(`messages:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`
        },
        (payload) => {
          console.log('[REALTIME] New message received:', payload.new);

          // Only add if not from current user (sender already added it)
          if (payload.new.sender_id !== currentUserId) {
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              if (prev.some(m => m.id === payload.new.id)) {
                return prev;
              }
              return [...prev, payload.new];
            });
            markMessagesAsRead(activeConversationId, currentUserId);
          }

          // Reload conversations to update last message preview
          loadConversations();
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Subscription status:', status);
      });

    return () => {
      console.log('[REALTIME] Unsubscribing from conversation');
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, currentUserId]);

  // Global conversation subscription (updates list when outside chat)
  useEffect(() => {
    console.log('[REALTIME] Setting up global message subscription');

    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('[REALTIME] Global message received:', payload.new);

          // Check if this message is for current user's conversation
          const { data: conversation } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', payload.new.conversation_id)
            .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
            .single();

          if (conversation) {
            console.log('[REALTIME] Message is for current user, reloading conversations');
            loadConversations();
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Global subscription status:', status);
      });

    return () => {
      console.log('[REALTIME] Unsubscribing from global messages');
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load today's poll and responses
  useEffect(() => {
    loadPollData();
  }, [currentUserId]);

  // Real-time poll responses subscription
  useEffect(() => {
    if (!todaysPoll) return;

    console.log('[POLLS] Setting up real-time subscription for poll:', todaysPoll.id);

    const channel = supabase
      .channel(`poll-responses:${todaysPoll.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_responses',
          filter: `poll_id=eq.${todaysPoll.id}`
        },
        (payload) => {
          console.log('[POLLS] Response update:', payload);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Reload responses to get updated data
            loadPollResponses(todaysPoll.id);
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted response
            setFriendResponses(prev => prev.filter(r => r.id !== payload.old.id));
            if (payload.old.user_id === currentUserId) {
              setMyResponse(null);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[POLLS] Subscription status:', status);
      });

    return () => {
      console.log('[POLLS] Unsubscribing from poll responses');
      supabase.removeChannel(channel);
    };
  }, [todaysPoll, currentUserId]);

  const loadPollData = async () => {
    // Get today's poll
    const poll = await getTodaysPoll();
    if (poll) {
      setTodaysPoll(poll);

      // Load responses
      await loadPollResponses(poll.id);

      // Load my response
      const myResp = await getMyResponse(poll.id, currentUserId);
      setMyResponse(myResp);
      if (myResp && myResp.response_type === 'NOTE') {
        setNoteText(myResp.note_text || '');
      }
    }
  };

  const loadPollResponses = async (pollId: number) => {
    const responses = await getFriendResponses(pollId, currentUserId);
    // Filter out current user's response
    setFriendResponses(responses.filter(r => r.user_id !== currentUserId));
  };

  const handleResponseClick = async (response: PollResponseType) => {
    // Open chat with the user who made this response
    const result = await getOrCreateConversation(currentUserId, response.user_id);
    if (result.success && result.conversationId) {
      setActiveConversationId(result.conversationId);

      // Set reply context
      const replyText = response.response_type === 'NOTE'
        ? response.note_text
        : `${response.vote_choice === 'A' ? todaysPoll?.option_a : todaysPoll?.option_b}`;

      setInputText(`Re: "${replyText}" - `);
      loadConversations();
    }
  };

  const handlePollVote = async (choice: 'A' | 'B') => {
    if (!todaysPoll) return;

    const responseType = choice === 'A' ? 'VOTE_A' : 'VOTE_B';
    const result = await submitPollResponse(
      todaysPoll.id,
      currentUserId,
      responseType,
      choice
    );

    if (result.success && result.response) {
      setMyResponse(result.response);
      setShowPollModal(false);
      // Responses will update via real-time
    }
  };

  const handleNoteSubmit = async () => {
    if (!todaysPoll || !noteText.trim()) return;

    const result = await submitPollResponse(
      todaysPoll.id,
      currentUserId,
      'NOTE',
      undefined,
      noteText.trim()
    );

    if (result.success && result.response) {
      setMyResponse(result.response);
      setShowPollModal(false);
      // Responses will update via real-time
    }
  };

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
    const result = await getOrCreateConversation(currentUserId, userId);
    if (result.success && result.conversationId) {
      setActiveConversationId(result.conversationId);
      setSearchQuery('');
      setSearchResults([]);
      loadConversations();
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConversationId || sendingMessage) return;

    setSendingMessage(true);
    const result = await sendMessage(
      activeConversationId,
      currentUserId,
      inputText,
      replyingTo?.id
    );

    if (result.success && result.message) {
      // Add message immediately for sender (optimistic update)
      setMessages(prev => [...prev, result.message!]);
      setInputText('');
      setReplyingTo(null);

      // Reload conversations to update last message preview
      loadConversations();
    }

    setSendingMessage(false);
  };

  const handleBack = () => {
    if (activeConversationId) {
      setActiveConversationId(null);
      setMessages([]);
      setReplyingTo(null);
    } else {
      onBack();
    }
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent, messageId: string) => {
    setSwipingMessageId(messageId);
    setSwipeX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent, messageId: string) => {
    if (swipingMessageId !== messageId) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - swipeX;
    if (diff > 0 && diff < 100) {
      e.currentTarget.style.transform = `translateX(${diff}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, message: any) => {
    if (swipingMessageId !== message.id) return;
    const currentX = e.changedTouches[0].clientX;
    const diff = currentX - swipeX;

    e.currentTarget.style.transform = '';

    if (diff > 50) {
      // Trigger reply
      setReplyingTo(message);
    }

    setSwipingMessageId(null);
    setSwipeX(0);
  };

  // If viewing a conversation
  if (activeConversationId) {
    const conversation = conversations.find(c => c.id === activeConversationId);

    return (
      <div className="h-full flex flex-col bg-theme-bg">
        {/* Compact Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-theme-divider bg-theme-card">
          <button onClick={handleBack} className="text-theme-text">
            <BackArrow />
          </button>
          <p className="font-bold text-theme-text text-sm">
            {conversation?.other_user_name || currentUser.username}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                onTouchStart={(e) => handleTouchStart(e, msg.id)}
                onTouchMove={(e) => handleTouchMove(e, msg.id)}
                onTouchEnd={(e) => handleTouchEnd(e, msg)}
              >
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 transition-transform ${isOwn
                  ? 'bg-theme-accent text-white'
                  : 'bg-theme-card text-theme-text border border-theme-divider'
                  }`}>
                  {msg.reply_to_id && (
                    <div className="text-xs opacity-70 mb-1 pb-1 border-b border-current/20">
                      Replying to message
                    </div>
                  )}
                  <p className="text-sm break-words">{msg.text}</p>
                  <p className="text-[10px] opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Preview */}
        {replyingTo && (
          <div className="px-4 py-2 bg-theme-card/50 border-t border-theme-divider flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-theme-secondary">Replying to:</p>
              <p className="text-sm text-theme-text truncate">{replyingTo.text}</p>
            </div>
            <button onClick={() => setReplyingTo(null)} className="text-theme-secondary">✕</button>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-theme-divider bg-theme-card">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Message..."
              className="flex-1 bg-theme-bg border border-theme-divider rounded-full px-4 py-2 text-sm text-theme-text placeholder-theme-secondary focus:outline-none focus:border-theme-accent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || sendingMessage}
              className="text-theme-accent font-bold text-sm disabled:opacity-50"
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
      {/* Compact Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-theme-divider bg-theme-card">
        <button onClick={onBack} className="text-theme-text">
          <BackArrow />
        </button>
        <p className="font-bold text-theme-text text-xs">{currentUser.username}</p>
      </div>

      {/* Tabs */}
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

          {/* Daily Poll Section */}
          <div className="p-4 bg-theme-card border-b border-theme-divider">
            {/* Question */}
            {todaysPoll && (
              <div className="mb-4">
                <p className="text-sm font-bold text-theme-text text-center">
                  {todaysPoll.question}
                </p>
              </div>
            )}

            {/* Responses - Horizontal Scroll */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {/* Current User First */}
              <div className="flex-shrink-0 w-24">
                <div className="relative flex flex-col items-center">
                  {/* Speech Bubble */}
                  {myResponse ? (
                    <div
                      onClick={() => setShowPollModal(true)}
                      className={`absolute bottom-full mb-2 px-3 py-2 rounded-2xl text-xs text-white font-medium cursor-pointer hover:scale-105 transition-transform min-w-[100px] max-w-[140px] ${myResponse.response_type === 'VOTE_A' ? 'bg-blue-500' :
                        myResponse.response_type === 'VOTE_B' ? 'bg-red-500' :
                          'bg-purple-500'
                        }`}
                    >
                      {/* Text */}
                      <p className="text-center break-words text-[11px] leading-tight">
                        {myResponse.response_type === 'NOTE'
                          ? (myResponse.note_text && myResponse.note_text.length > 60
                            ? myResponse.note_text.substring(0, 60) + '...'
                            : myResponse.note_text)
                          : myResponse.vote_choice === 'A'
                            ? todaysPoll?.option_a
                            : todaysPoll?.option_b
                        }
                      </p>

                      {/* Badge for Vote (A or B) */}
                      {myResponse.response_type !== 'NOTE' && (
                        <div className="mt-1 flex justify-center">
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {myResponse.vote_choice}
                          </span>
                        </div>
                      )}

                      {/* Triangle pointer */}
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent ${myResponse.response_type === 'VOTE_A' ? 'border-t-blue-500' :
                        myResponse.response_type === 'VOTE_B' ? 'border-t-red-500' :
                          'border-t-purple-500'
                        }`} />
                    </div>
                  ) : (
                    <div
                      onClick={() => setShowPollModal(true)}
                      className="absolute bottom-full mb-2 px-3 py-2 rounded-2xl text-xs bg-theme-divider text-theme-secondary font-medium cursor-pointer hover:scale-105 transition-transform"
                    >
                      <p>Respond</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-theme-divider" />
                    </div>
                  )}

                  {/* Avatar */}
                  <button onClick={() => setShowPollModal(true)} className="relative">
                    <Avatar url={currentUser.avatarUrl} size="md" border />
                    {!myResponse && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-theme-accent rounded-full flex items-center justify-center text-xs border-2 border-theme-bg">
                        +
                      </div>
                    )}
                  </button>
                  <p className="text-xs text-theme-secondary text-center mt-1 truncate w-full">You</p>
                </div>
              </div>

              {/* Friend Responses */}
              {friendResponses.map((response) => (
                <div key={response.id} className="flex-shrink-0 w-24">
                  <div className="relative flex flex-col items-center">
                    {/* Speech Bubble */}
                    <div
                      onClick={() => handleResponseClick(response)}
                      className={`absolute bottom-full mb-2 px-3 py-2 rounded-2xl text-xs text-white font-medium cursor-pointer hover:scale-105 transition-transform min-w-[100px] max-w-[140px] ${response.response_type === 'VOTE_A' ? 'bg-blue-500' :
                        response.response_type === 'VOTE_B' ? 'bg-red-500' :
                          'bg-purple-500'
                        }`}
                    >
                      {/* Text */}
                      <p className="text-center break-words text-[11px] leading-tight">
                        {response.response_type === 'NOTE'
                          ? (response.note_text && response.note_text.length > 60
                            ? response.note_text.substring(0, 60) + '...'
                            : response.note_text)
                          : response.vote_choice === 'A'
                            ? todaysPoll?.option_a
                            : todaysPoll?.option_b
                        }
                      </p>

                      {/* Badge for Vote (A or B) */}
                      {response.response_type !== 'NOTE' && (
                        <div className="mt-1 flex justify-center">
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {response.vote_choice}
                          </span>
                        </div>
                      )}

                      {/* Triangle pointer */}
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent ${response.response_type === 'VOTE_A' ? 'border-t-blue-500' :
                        response.response_type === 'VOTE_B' ? 'border-t-red-500' :
                          'border-t-purple-500'
                        }`} />
                    </div>

                    {/* Avatar */}
                    <button onClick={() => handleResponseClick(response)}>
                      <Avatar url={response.user_avatar || ''} size="md" border />
                    </button>
                    <p className="text-xs text-theme-secondary text-center mt-1 truncate w-full">
                      {response.user_name?.split(' ')[0]}
                    </p>
                  </div>
                </div>
              ))}
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
                  className="w-full flex items-center gap-3 p-3 hover:bg-theme-card transition-colors border-b border-theme-divider"
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
        // Activity Tab
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
                <div onClick={() => user && onProfileClick(user)} className="relative cursor-pointer hover:scale-105 transition-transform">
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

      {/* Poll Response Modal */}
      {showPollModal && todaysPoll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card rounded-3xl w-full max-w-md overflow-hidden border border-theme-divider">
            {/* Header */}
            <div className="p-4 border-b border-theme-divider">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-theme-text text-lg">Daily Poll</h3>
                <button onClick={() => setShowPollModal(false)} className="text-theme-secondary hover:text-theme-text">
                  ✕
                </button>
              </div>
              <p className="text-sm text-theme-text text-center">{todaysPoll.question}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-theme-divider">
              <button
                onClick={() => setPollModalTab('POLL')}
                className={`flex-1 py-3 font-bold text-sm transition-colors relative ${pollModalTab === 'POLL' ? 'text-theme-text' : 'text-theme-secondary'
                  }`}
              >
                Poll
                {pollModalTab === 'POLL' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-accent" />
                )}
              </button>
              <button
                onClick={() => setPollModalTab('NOTE')}
                className={`flex-1 py-3 font-bold text-sm transition-colors relative ${pollModalTab === 'NOTE' ? 'text-theme-text' : 'text-theme-secondary'
                  }`}
              >
                Note
                {pollModalTab === 'NOTE' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-accent" />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {pollModalTab === 'POLL' ? (
                <div className="space-y-3">
                  <button
                    onClick={() => handlePollVote('A')}
                    className={`w-full p-4 rounded-2xl border-2 transition-all ${myResponse?.vote_choice === 'A'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-theme-divider text-theme-text hover:border-blue-500'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{todaysPoll.option_a}</span>
                      <span className="text-2xl">{todaysPoll.emoji_a}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handlePollVote('B')}
                    className={`w-full p-4 rounded-2xl border-2 transition-all ${myResponse?.vote_choice === 'B'
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'border-theme-divider text-theme-text hover:border-red-500'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{todaysPoll.option_b}</span>
                      <span className="text-2xl">{todaysPoll.emoji_b}</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Share your thoughts, a song, or anything..."
                    maxLength={150}
                    className="w-full h-32 bg-theme-bg border border-theme-divider rounded-2xl px-4 py-3 text-sm text-theme-text placeholder-theme-secondary focus:outline-none focus:border-theme-accent resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-theme-secondary">
                      {noteText.length}/150 characters
                    </span>
                    <button
                      onClick={handleNoteSubmit}
                      disabled={!noteText.trim()}
                      className="px-6 py-2 bg-purple-500 text-white rounded-full font-bold text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Share Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
