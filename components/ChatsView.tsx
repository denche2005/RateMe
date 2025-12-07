
import React, { useState, useEffect, useRef } from 'react';
import { ChatPreview, ChatMessage, User, Notification, Post, BadgeType } from '../types';
import { Avatar, BackArrow, BadgeIcon, ScoreBadge, NeonButton } from './NeonComponents';

type PollResponse = { type: 'VOTE', choice: 'A' | 'B' } | { type: 'NOTE', text: string };

interface Props {
  users: User[];
  notifications: Notification[];
  posts: Post[];
  chatList: ChatPreview[];
  messages: Record<string, ChatMessage[]>;
  setMessages: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
  setChatList?: React.Dispatch<React.SetStateAction<ChatPreview[]>>; 
  onBack: () => void;
  activeChatId: string | null;
  onOpenChat: (id: string) => void;
  onProfileClick: (user: User) => void;
  onPostClick?: (post: Post) => void;
  onNotificationClick?: (notification: Notification) => void;
  userResponse: PollResponse | null;
  onRespond: (resp: PollResponse) => void;
}

// Helper type for the selected note view
interface SelectedNote {
    user: User;
    response: { type: 'VOTE', choice?: string, text: string };
}

export const ChatsView: React.FC<Props> = ({ 
  users, 
  notifications, 
  posts,
  chatList,
  messages,
  setMessages,
  setChatList,
  onBack, 
  activeChatId, 
  onOpenChat, 
  onProfileClick,
  onPostClick,
  onNotificationClick,
  userResponse,
  onRespond
}) => {
  const [activeTab, setActiveTab] = useState<'MESSAGES' | 'ACTIVITY'>('MESSAGES');
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Swipe logic states
  const [swipeState, setSwipeState] = useState<{ id: string, startX: number, currentX: number } | null>(null);

  // --- DAY'S QUESTION STATE ---
  const [showVoteMenu, setShowVoteMenu] = useState(false);
  const [menuMode, setMenuMode] = useState<'VOTE' | 'NOTE'>('VOTE');
  const [noteInput, setNoteInput] = useState('');

  // --- NEW: NOTE DETAILS / REPLY STATE ---
  const [selectedNote, setSelectedNote] = useState<SelectedNote | null>(null);
  const [noteReplyText, setNoteReplyText] = useState('');
  
  // Mock Data for the Poll
  const dailyQuestion = {
      question: "Messi or Cristiano? ⚽️",
      optionA: "Messi 🇦🇷",
      optionB: "Cristiano 🇵🇹",
      friendAnswers: [
          { userId: 'u1', type: 'VOTE', choice: 'A', text: "Leo 🐐" }, // Vote (text ignored in UI now)
          { userId: 'u2', type: 'NOTE', text: "Waiting for the weekend to sleep all day long because I am exhausted 😴" }, // Note
          { userId: 'u3', type: 'VOTE', choice: 'B', text: "Siuuuu" } // Vote (text ignored in UI now)
      ]
  };

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (activeChatId) {
      scrollToBottom();
    }
  }, [activeChatId, messages, replyingTo]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChatId) return;

    let replyData = undefined;
    if (replyingTo) {
        const sender = users.find(u => u.id === replyingTo.senderId);
        replyData = {
            id: replyingTo.id,
            text: replyingTo.text,
            senderName: replyingTo.isOwn ? 'You' : (sender?.displayName || 'User')
        };
    }

    const newMessage: ChatMessage = {
      id: `m_${Date.now()}`,
      senderId: 'me',
      text: inputText,
      timestamp: Date.now(),
      isOwn: true,
      type: 'text',
      replyTo: replyData
    };

    setMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMessage]
    }));

    setInputText('');
    setReplyingTo(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeChatId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newMessage: ChatMessage = {
          id: `m_img_${Date.now()}`,
          senderId: 'me',
          text: 'Sent an image 📷',
          timestamp: Date.now(),
          isOwn: true,
          type: 'image',
          mediaUrl: base64
        };
        
        setMessages(prev => ({
            ...prev,
            [activeChatId]: [...(prev[activeChatId] || []), newMessage]
        }));
        
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const onTouchStart = (e: React.TouchEvent, msgId: string) => {
    setSwipeState({ id: msgId, startX: e.touches[0].clientX, currentX: e.touches[0].clientX });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swipeState) return;
    const diff = e.touches[0].clientX - swipeState.startX;
    if (diff > 0 && diff < 100) {
        setSwipeState({ ...swipeState, currentX: e.touches[0].clientX });
    }
  };

  const onTouchEnd = (msg: ChatMessage) => {
     if (swipeState && (swipeState.currentX - swipeState.startX > 50)) {
         setReplyingTo(msg);
         if (navigator.vibrate) navigator.vibrate(50);
     }
     setSwipeState(null);
  };

  const handleSubmitResponse = (type: 'VOTE' | 'NOTE', value: string) => {
      if (type === 'VOTE') {
          // Store raw choice 'A' or 'B'
          onRespond({ type: 'VOTE', choice: value as 'A' | 'B' });
      } else {
          if (!value.trim()) return;
          onRespond({ type: 'NOTE', text: value });
      }
      setShowVoteMenu(false);
      setNoteInput('');
  };

  // Logic to reply to a note from the modal
  const handleReplyToNote = () => {
      if (!selectedNote || !noteReplyText.trim()) return;
      if (!setChatList) return; // Guard if setter not provided

      const targetUserId = selectedNote.user.id;
      
      // Find existing chat
      let existingChat = chatList.find(c => c.userId === targetUserId);
      let chatId = existingChat ? existingChat.id : `c_new_${Date.now()}`;

      // DETERMINE REPLY CONTENT
      // If it was a vote, use the clean Option Name. If it was a note, use the actual text.
      let replyContent = selectedNote.response.text;
      if (selectedNote.response.type === 'VOTE') {
          const choice = selectedNote.response.choice;
          // Use only the name part (split by space to remove flag if needed, or keep full option)
          replyContent = choice === 'A' ? dailyQuestion.optionA : dailyQuestion.optionB;
      }

      const newMessage: ChatMessage = {
          id: `m_${Date.now()}`,
          senderId: 'me',
          text: noteReplyText,
          timestamp: Date.now(),
          isOwn: true,
          type: 'text',
          replyTo: {
              id: `note_${Date.now()}`, // Fake ID for the note
              text: replyContent, // UPDATED: Now uses clean option text for votes
              senderName: selectedNote.user.displayName
          }
      };

      // Update Messages
      setMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), newMessage]
      }));

      // Update Chat List (Reorder or Create)
      setChatList(prev => {
          const filtered = prev.filter(c => c.id !== chatId);
          const newChatPreview: ChatPreview = {
              id: chatId,
              userId: targetUserId,
              lastMessage: noteReplyText,
              unreadCount: 0,
              timestamp: Date.now()
          };
          // Move to top
          return [newChatPreview, ...filtered];
      });

      // Close modal and reset
      setNoteReplyText('');
      setSelectedNote(null);
  };

  if (activeChatId) {
    const chat = chatList.find(c => c.id === activeChatId);
    const partnerId = chat ? chat.userId : users.find(u => u.id === activeChatId)?.id; 
    const partner = users.find(u => u.id === partnerId);
    const activeMessages = messages[activeChatId] || [];

    return (
      <div className="h-full flex flex-col bg-theme-bg animate-fade-in text-theme-text relative">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
        />

        <div className="px-4 py-3 bg-theme-card/90 backdrop-blur-md border-b border-theme-text/5 flex items-center gap-3 shrink-0 z-20 pt-4">
          <BackArrow onClick={onBack} />
          
          <div 
            className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors overflow-hidden"
            onClick={() => partner && onProfileClick(partner)}
          >
             {partner && <Avatar url={partner.avatarUrl} size="sm" />}
             <div className="flex-1 min-w-0">
               <h3 className="font-bold text-theme-text text-sm truncate">{partner?.displayName || 'User'}</h3>
               <span className="text-[10px] text-theme-accent uppercase tracking-wide">Online</span>
             </div>
          </div>

          <button className="w-10 h-10 rounded-full bg-theme-bg border border-theme-divider flex items-center justify-center text-theme-text hover:text-theme-accent hover:border-theme-accent transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 5.25V4.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {activeMessages.map(msg => {
            const isSwiping = swipeState?.id === msg.id;
            const translateX = isSwiping ? swipeState.currentX - swipeState.startX : 0;
            
            return (
                <div 
                   key={msg.id} 
                   className="relative"
                   onTouchStart={(e) => onTouchStart(e, msg.id)}
                   onTouchMove={onTouchMove}
                   onTouchEnd={() => onTouchEnd(msg)}
                   style={{ transform: `translateX(${translateX}px)`, transition: isSwiping ? 'none' : 'transform 0.2s ease-out' }}
                >
                    <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                        <div 
                           className={`max-w-[70%] rounded-2xl text-[14px] font-medium leading-relaxed tracking-wide shadow-sm overflow-hidden ${
                             msg.isOwn 
                             ? 'bg-brand-gradient text-white rounded-tr-none' 
                             : 'rounded-tl-none' // Removed hardcoded dark styles
                           }`}
                           // UPDATED: Using style attribute with CSS Variables for light mode support on "Other" messages
                           style={!msg.isOwn ? { 
                               backgroundColor: 'var(--msg-bg-other)', 
                               color: 'var(--msg-text-other)' 
                           } : {}}
                        >
                            {msg.replyTo && (
                                <div className={`mx-1 mt-1 mb-0 p-1.5 rounded-md border-l-2 border-theme-accent/50 text-[10px] flex flex-col ${msg.isOwn ? 'bg-black/20 text-white/90' : 'bg-black/5 opacity-80'}`}>
                                    <span className="font-bold opacity-75 mb-0.5">{msg.replyTo.senderName}</span>
                                    <span className="truncate opacity-70 line-clamp-1">{msg.replyTo.text}</span>
                                </div>
                            )}

                            {msg.type === 'image' && msg.mediaUrl ? (
                                <div className="border-t border-white/10 first:border-none">
                                    <img src={msg.mediaUrl} alt="Sent" className="w-full h-auto object-cover max-h-[300px]" />
                                </div>
                            ) : msg.type === 'post' && msg.postId ? (
                                <div 
                                  onClick={() => msg.postId && posts.find(p => p.id === msg.postId) && onPostClick && onPostClick(posts.find(p => p.id === msg.postId)!)}
                                  className="cursor-pointer p-3 hover:bg-white/10 transition-colors"
                                >
                                  <span className="text-xs font-bold block mb-1">Shared Post 📷</span>
                                  <div className="w-full h-32 bg-gray-800 rounded-lg overflow-hidden relative">
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">Preview</div>
                                  </div>
                                </div>
                            ) : (
                                <div className="px-3 py-2 whitespace-pre-wrap">
                                    {msg.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-theme-bg border-t border-theme-text/10 shrink-0 pb-6">
          {replyingTo && (
            <div className="flex justify-between items-center px-4 py-2 bg-theme-card/50 border-b border-theme-divider">
                <div className="flex flex-col min-w-0 pr-4 border-l-2 border-theme-accent pl-2 ml-1">
                    <span className="text-xs font-bold text-theme-accent">Replying to {replyingTo.isOwn ? 'Yourself' : 'User'}</span>
                    <span className="text-xs text-theme-secondary truncate">{replyingTo.text}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-theme-secondary">✕</button>
            </div>
          )}

          <div className="p-3 flex gap-2 items-end">
            <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-12 h-12 flex items-center justify-center text-theme-secondary hover:text-theme-text transition-colors shrink-0"
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
               </svg>
            </button>

            <div className="flex-1 bg-theme-card border border-theme-divider rounded-full flex items-center px-4 py-1 min-h-[44px]">
                <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={scrollToBottom}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Message..."
                className="w-full bg-transparent border-none text-theme-text focus:outline-none h-full py-2 placeholder-gray-500 text-sm"
                />
            </div>
            
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="w-12 h-12 text-theme-accent font-bold active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shrink-0 flex items-center justify-center hover:text-white hover:drop-shadow-lg"
            >
              <span className="text-sm font-bold">Send</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inbox View
  
  // SORT FRIEND ANSWERS: VOTES FIRST, THEN NOTES
  const sortedFriendAnswers = [...dailyQuestion.friendAnswers].sort((a, b) => {
      // If a is VOTE and b is NOTE, a comes first (-1)
      if (a.type === 'VOTE' && b.type === 'NOTE') return -1;
      // If a is NOTE and b is VOTE, b comes first (1)
      if (a.type === 'NOTE' && b.type === 'VOTE') return 1;
      return 0; // Keep relative order if same type
  });

  return (
    <div className="h-full bg-theme-bg flex flex-col pt-4 text-theme-text relative">
      
      {/* --- SELECTED NOTE MODAL (SUBMENU) --- */}
      {selectedNote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNote(null)}></div>
              <div className="bg-theme-card w-full max-w-sm rounded-3xl p-6 border border-theme-divider shadow-2xl relative z-10 animate-fade-in transform transition-all duration-200 scale-100 origin-center flex flex-col items-center">
                  
                  {/* Header: User Info */}
                  <div className="flex flex-col items-center gap-2 mb-6">
                      <Avatar url={selectedNote.user.avatarUrl} size="lg" border={true} />
                      <div className="text-center">
                          <h3 className="text-lg font-black text-theme-text leading-tight">{selectedNote.user.displayName}</h3>
                          <p className="text-xs text-theme-secondary font-medium">@{selectedNote.user.username}</p>
                      </div>
                  </div>

                  {/* Body: Full Content */}
                  <div className="w-full bg-theme-bg/50 rounded-2xl p-6 border border-theme-divider mb-6 text-center shadow-inner relative overflow-hidden">
                      {selectedNote.response.type === 'VOTE' && (
                          <div className="absolute top-0 left-0 w-full h-1 bg-brand-gradient"></div>
                      )}
                      
                      {selectedNote.response.type === 'VOTE' && (
                           <div className="text-5xl mb-2 drop-shadow-md">
                               {selectedNote.response.choice === 'A' ? dailyQuestion.optionA.split(' ')[1] : dailyQuestion.optionB.split(' ')[1]}
                           </div>
                      )}

                      <p className={`text-theme-text font-medium leading-relaxed ${selectedNote.response.type === 'VOTE' ? 'text-lg font-bold' : 'text-base italic'}`}>
                          {selectedNote.response.type === 'VOTE' 
                             ? (selectedNote.response.choice === 'A' ? dailyQuestion.optionA.split(' ')[0] : dailyQuestion.optionB.split(' ')[0])
                             : `"${selectedNote.response.text}"`
                          }
                      </p>
                  </div>

                  {/* Reply Input */}
                  <div className="w-full flex gap-2">
                      <input 
                         type="text" 
                         value={noteReplyText}
                         onChange={(e) => setNoteReplyText(e.target.value)}
                         placeholder={`Reply to ${selectedNote.user.displayName.split(' ')[0]}...`}
                         className="flex-1 bg-theme-bg border border-theme-divider rounded-xl px-4 py-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent transition-colors"
                      />
                      <button 
                         onClick={handleReplyToNote}
                         disabled={!noteReplyText.trim()}
                         className="bg-theme-accent text-white rounded-xl px-4 py-2 font-bold text-sm disabled:opacity-50 hover:bg-theme-accent/80 transition-colors"
                      >
                         Send
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- FLOATING VOTE MENU --- */}
      {showVoteMenu && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowVoteMenu(false)}></div>
             {/* Redesigned Menu Container - Solid Theme Card Style */}
             <div className="bg-theme-card w-full max-w-sm rounded-3xl flex flex-col border border-theme-divider shadow-2xl relative z-10 animate-fade-in transition-colors duration-300 overflow-hidden">
                 
                 {/* Compact Header */}
                 <div className="px-6 py-4 border-b border-theme-divider bg-theme-bg/50 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest">DAILY POLL</div>
                        <h2 className="text-base font-black text-theme-text">Your Answer</h2>
                    </div>
                    <button 
                        onClick={() => setShowVoteMenu(false)}
                        className="w-8 h-8 rounded-full bg-theme-bg flex items-center justify-center text-theme-text hover:text-red-500 transition-colors"
                    >
                        ✕
                    </button>
                 </div>

                 {/* Mode Toggle Pills */}
                 <div className="px-6 pt-6 pb-2">
                     <div className="flex bg-theme-bg rounded-xl p-1 relative border border-theme-divider">
                         <div 
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-theme-card shadow-sm transition-all duration-300 ease-out ${menuMode === 'VOTE' ? 'left-1' : 'left-[calc(50%+4px)]'}`}
                         ></div>
                         <button 
                            onClick={() => setMenuMode('VOTE')} 
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors relative z-10 ${menuMode === 'VOTE' ? 'text-theme-text' : 'text-theme-secondary hover:text-theme-text'}`}
                         >
                            Vote
                         </button>
                         <button 
                            onClick={() => setMenuMode('NOTE')} 
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors relative z-10 ${menuMode === 'NOTE' ? 'text-theme-text' : 'text-theme-secondary hover:text-theme-text'}`}
                         >
                            Note
                         </button>
                     </div>
                 </div>

                 <div className="p-6">
                     {menuMode === 'VOTE' ? (
                         <div className="flex flex-col gap-3 animate-fade-in">
                            <button 
                                onClick={() => handleSubmitResponse('VOTE', 'A')} 
                                className="w-full text-left px-5 py-4 rounded-xl bg-theme-bg border border-theme-divider hover:border-theme-accent text-sm font-bold text-theme-text transition-all flex justify-between items-center group active:scale-[0.98]"
                            >
                                <span>{dailyQuestion.optionA}</span>
                                <span className="w-6 h-6 rounded-full bg-theme-card border border-theme-divider flex items-center justify-center text-[10px] group-hover:bg-theme-accent group-hover:text-white transition-colors">A</span>
                            </button>
                            <button 
                                onClick={() => handleSubmitResponse('VOTE', 'B')} 
                                className="w-full text-left px-5 py-4 rounded-xl bg-theme-bg border border-theme-divider hover:border-theme-accent text-sm font-bold text-theme-text transition-all flex justify-between items-center group active:scale-[0.98]"
                            >
                                <span>{dailyQuestion.optionB}</span>
                                <span className="w-6 h-6 rounded-full bg-theme-card border border-theme-divider flex items-center justify-center text-[10px] group-hover:bg-theme-accent group-hover:text-white transition-colors">B</span>
                            </button>
                         </div>
                     ) : (
                         <div className="flex flex-col gap-4 animate-fade-in">
                             <textarea
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                placeholder="Type something..."
                                className="w-full bg-theme-bg border border-theme-divider rounded-xl px-4 py-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent resize-none h-24 placeholder-gray-500"
                             />
                             <NeonButton 
                                onClick={() => handleSubmitResponse('NOTE', noteInput)} 
                                className="w-full py-3 text-xs shadow-lg"
                                disabled={!noteInput.trim()}
                             >
                                Post Note
                             </NeonButton>
                         </div>
                     )}
                 </div>
             </div>
         </div>
      )}

      <div className="px-4 mb-2">
        <div className="flex items-center gap-4 mb-4">
             <BackArrow onClick={onBack} />
             <h1 className="text-3xl font-black text-theme-text">Inbox</h1>
        </div>

        {/* --- DAY'S QUESTION SECTION --- */}
        <div className="mb-2"> 
            <h2 className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest mb-1 flex items-center gap-2 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse"></span>
                Daily Poll
            </h2>
            <h3 className="text-lg font-bold text-theme-text mb-0 px-1 leading-tight">{dailyQuestion.question}</h3>
            
            {/* Friends Answers Scroll - GAP REDUCED TO 5 */}
            <div className="flex gap-5 overflow-x-auto no-scrollbar px-1 pb-4 min-h-[120px] items-start pt-8"> 
                
                {/* USER ITEM (VOTING TRIGGER) */}
                <div className="flex flex-col items-center gap-2 shrink-0 animate-fade-in relative z-10 w-20">
                    <div 
                        className="relative pt-4 cursor-pointer group"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Always allow changing the answer by opening the menu
                            setShowVoteMenu(true);
                        }}
                    >
                        {/* Note Bubble (If Voted/Replied) */}
                        {userResponse && (
                            // UPDATED: Filter Drop-Shadow on container merges shapes into one silhouette
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 filter drop-shadow-md transition-transform duration-200 active:scale-95">
                                <div 
                                    className={`px-2.5 py-1.5 rounded-2xl flex items-center justify-center min-w-[50px] relative
                                    ${userResponse.type === 'VOTE' 
                                    ? 'bg-brand-gradient text-white whitespace-nowrap' 
                                    : 'bg-theme-card text-theme-text w-auto max-w-[100px] text-center'}
                                    `}
                                >
                                    {/* TAIL (Rotated Square) */}
                                    <div 
                                        className={`absolute w-3 h-3 rotate-45 bottom-[-4px] left-4 z-[-1]`}
                                        // Force color to match container exactly to appear as one shape
                                        // UPDATED: Use theme variable instead of hardcoded blue
                                        style={{ backgroundColor: userResponse.type === 'VOTE' ? 'var(--theme-primary)' : 'var(--bg-card)' }}
                                    ></div>

                                    <div className={`font-bold flex items-center justify-center gap-1 overflow-hidden ${
                                        userResponse.type === 'VOTE' ? 'text-[10px]' : 'text-[9px] leading-3 line-clamp-2 break-words text-ellipsis'
                                    }`}>
                                        {/* NEW MINIMALIST SVG ICON (Replacing emoji) */}
                                        {userResponse.type === 'VOTE' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-1 opacity-90">
                                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                                <line x1="6" y1="20" x2="6" y2="14"></line>
                                            </svg>
                                        )}
                                        {/* Enforce Uniformity: Ensure only option name is shown for votes */}
                                        {userResponse.type === 'VOTE' 
                                            ? (userResponse.choice === 'A' ? dailyQuestion.optionA.split(' ')[0] : dailyQuestion.optionB.split(' ')[0]) 
                                            : (userResponse.text.length > 25 ? userResponse.text.substring(0, 25) + '...' : userResponse.text)}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                           <Avatar url={users.find(u => u.id === 'me')?.avatarUrl || ''} size="md" className="!w-16 !h-16 transition-transform active:scale-95" border={!!userResponse} />
                           
                           {/* Add Badge (Bottom Right) */}
                           {!userResponse && (
                               <div 
                                    className="absolute -bottom-0 -right-0 w-6 h-6 bg-theme-card border border-theme-divider rounded-full flex items-center justify-center shadow-lg text-[10px] text-theme-text group-hover:scale-110 transition-transform z-20 hover:bg-theme-accent hover:text-white cursor-pointer"
                               >
                                   ★
                               </div>
                           )}
                           
                           {/* Voted Indicator (Bottom Right) */}
                           {userResponse && userResponse.type === 'VOTE' && (
                               <div className={`absolute -bottom-0 -right-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-theme-bg ${userResponse.choice === 'A' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                   {userResponse.choice}
                               </div>
                           )}
                        </div>
                    </div>
                    <span className="text-[10px] text-theme-secondary font-medium">You</span>
                </div>

                {/* Friend Answers - USING SORTED ARRAY */}
                {sortedFriendAnswers.map((ans, i) => {
                    const friend = users.find(u => u.id === ans.userId);
                    if (!friend) return null;
                    
                    const isVote = ans.type === 'VOTE';
                    
                    // UNIFORM TEXT LOGIC
                    let bubbleText = '';
                    if (isVote) {
                        const choice = (ans as any).choice;
                        bubbleText = choice === 'A' ? dailyQuestion.optionA.split(' ')[0] : dailyQuestion.optionB.split(' ')[0];
                    } else {
                        // Truncate notes
                        bubbleText = ans.text.length > 25 ? ans.text.substring(0, 25) + '...' : ans.text;
                    }

                    return (
                        <div 
                           key={i} 
                           className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group w-20" 
                           onClick={() => setSelectedNote({ user: friend, response: ans as any })}
                        >
                            <div className="relative pt-4">
                                {/* Response Bubble - TAIL LEFT-4 */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 filter drop-shadow-md transition-transform duration-200 active:scale-95">
                                    <div 
                                        className={`px-2.5 py-1.5 rounded-2xl flex items-center justify-center min-w-[50px] relative
                                        ${isVote 
                                        ? 'bg-brand-gradient text-white whitespace-nowrap' 
                                        : 'bg-theme-card text-theme-text w-auto max-w-[100px] text-center'}
                                        `}
                                    >
                                        {/* TAIL */}
                                        <div 
                                            className={`absolute w-3 h-3 rotate-45 bottom-[-4px] left-4 z-[-1]`}
                                            style={{ backgroundColor: isVote ? 'var(--theme-primary)' : 'var(--bg-card)' }}
                                        ></div>

                                        <div className={`font-bold flex items-center justify-center gap-1 overflow-hidden ${
                                            isVote ? 'text-[10px]' : 'text-[9px] leading-3 break-words text-ellipsis'
                                        }`}>
                                        {/* NEW MINIMALIST SVG ICON (Replacing emoji) */}
                                        {isVote && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-1 opacity-90 drop-shadow-sm">
                                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                                <line x1="6" y1="20" x2="6" y2="14"></line>
                                            </svg>
                                        )}
                                        {bubbleText}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Avatar */}
                                <Avatar 
                                    url={friend.avatarUrl} 
                                    size="md" 
                                    className={`!w-16 !h-16 transition-transform active:scale-95 ${isVote && (ans as any).choice === 'A' ? 'ring-2 ring-blue-500/20' : isVote ? 'ring-2 ring-green-500/20' : ''}`} 
                                    border={false} 
                                />
                                
                                {/* Choice Indicator (Only if Vote) */}
                                {isVote && (
                                    <div className={`absolute -bottom-0 -right-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-theme-bg ${(ans as any).choice === 'A' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                        {(ans as any).choice}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-theme-secondary font-medium">{friend.displayName.split(' ')[0]}</span>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="flex border-b border-theme-text/10">
           <button onClick={() => setActiveTab('MESSAGES')} className={`flex-1 pb-3 font-bold text-sm transition-colors relative ${activeTab === 'MESSAGES' ? 'text-theme-text' : 'text-theme-secondary'}`}>Messages</button>
           <button onClick={() => setActiveTab('ACTIVITY')} className={`flex-1 pb-3 font-bold text-sm transition-colors relative ${activeTab === 'ACTIVITY' ? 'text-theme-text' : 'text-theme-secondary'}`}>Activity</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {activeTab === 'MESSAGES' && (
          <>
            {chatList.map(chat => {
              const user = users.find(u => u.id === chat.userId);
              if (!user) return null;
              return (
                <div key={chat.id} onClick={() => onOpenChat(chat.id)} className="px-4 py-3 flex items-center gap-4 hover:bg-theme-text/5 cursor-pointer transition-colors">
                  <div className="relative">
                    <Avatar url={user.avatarUrl} size="md" />
                    {chat.unreadCount > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold border border-black text-white">{chat.unreadCount}</div>}
                  </div>
                  <div className="flex-1 border-b border-theme-text/5 pb-3">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-theme-text text-lg">{user.displayName}</span>
                      <span className="text-xs text-theme-secondary">{new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'text-theme-text font-semibold' : 'text-theme-secondary'}`}>{chat.lastMessage}</p>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {activeTab === 'ACTIVITY' && (
           <div className="px-2">
             {notifications.map(notif => {
                const user = users.find(u => u.id === notif.raterId);
                const isDescribed = notif.type === 'DESCRIBED';

                return (
                  <div 
                    key={notif.id} 
                    onClick={() => {
                        if (isDescribed && onNotificationClick) {
                            onNotificationClick(notif);
                        } else if (user) {
                            onProfileClick(user);
                        }
                    }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-theme-text/5 transition-colors cursor-pointer group active:scale-98"
                  >
                       <div className="relative">
                         <Avatar url={user ? user.avatarUrl : ''} size="md" />
                         <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-gradient rounded-full flex items-center justify-center text-[10px] text-white shadow-sm border border-theme-bg">
                            {isDescribed ? '✨' : '★'}
                         </div>
                       </div>
                       
                       <div className="flex-1">
                          <p className="text-sm text-theme-text">
                            <span className="font-bold">{notif.raterName}</span> 
                            {isDescribed ? ' described you.' : ' rated your post.'}
                          </p>
                          <span className="text-[10px] text-theme-secondary">
                             {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                       
                       {/* Right side minimalist indicator */}
                       <div>
                          {isDescribed ? (
                              <BadgeIcon type={BadgeType.CHARISMA} className="w-8 h-8 text-theme-accent drop-shadow-sm" />
                          ) : (
                              <ScoreBadge score={notif.score} size="sm" />
                          )}
                       </div>
                  </div>
                );
             })}
           </div>
        )}
      </div>
    </div>
  );
};
