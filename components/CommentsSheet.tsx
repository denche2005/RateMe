import React, { useState, useRef } from 'react';
import { Comment, User } from '../types';
import { Avatar } from './NeonComponents';

interface Props {
  comments: Comment[];
  users: User[];
  onClose: () => void;
  onAddComment: (text: string) => void;
  onLikeComment: (commentId: string) => void;
  onUserClick: (user: User) => void;
  likedCommentIds?: string[];
}

export const CommentsSheet: React.FC<Props> = ({ comments, users, onClose, onAddComment, onLikeComment, onUserClick, likedCommentIds = [] }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddComment(text);
      setText('');
    }
  };

  const handleReplyClick = (username: string) => {
    setText(`@${username} `);
    inputRef.current?.focus();
  };

  const renderText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        const user = users.find(u => u.username === username);
        if (user) {
          return (
            <span
              key={i}
              className="text-theme-accent font-bold cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onUserClick(user);
              }}
            >
              {part}
            </span>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-theme-card rounded-t-3xl h-[70vh] flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out]">

        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-500/50 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-theme-divider flex justify-between items-center">
          <h3 className="font-bold text-theme-text text-center w-full">Comments ({comments.length})</h3>
          <button onClick={onClose} className="absolute right-4 text-theme-secondary hover:text-theme-text">✕</button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {comments.map(comment => {
            const user = users.find(u => u.id === comment.userId);
            if (!user) return null;

            const isLiked = likedCommentIds.includes(comment.id);

            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar url={user.avatarUrl} size="sm" border={false} />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-theme-secondary">{user.displayName}</span>
                    <span className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-theme-text leading-tight mt-0.5">{renderText(comment.text)}</p>

                  <div className="flex items-center gap-4 mt-2">
                    <span
                      onClick={() => handleReplyClick(user.username)}
                      className="text-xs text-theme-secondary font-bold cursor-pointer hover:text-theme-accent"
                    >
                      Reply
                    </span>

                    {/* Like Button */}
                    <div
                      onClick={() => onLikeComment(comment.id)}
                      className="flex items-center gap-1.5 cursor-pointer group transition-all active:scale-110"
                    >
                      {/* Heart Icon: Fill transparent by default, Red when liked */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill={isLiked ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className={`w-4 h-4 transition-colors duration-300 ${isLiked ? 'text-red-500' : 'text-gray-500 group-hover:text-gray-300'}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                      <span className={`text-xs ${isLiked ? 'text-theme-text' : 'text-gray-500'}`}>{comment.likes}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {comments.length === 0 && (
            <div className="text-center text-theme-secondary mt-10">
              <p>No comments yet. Be the first!</p>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 bg-theme-bg border-t border-theme-divider flex gap-3 items-center">
          <Avatar url="https://picsum.photos/200/200?random=100" size="sm" border={false} />
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-theme-card border border-theme-divider rounded-full py-2.5 pl-4 pr-12 text-sm text-theme-text focus:outline-none focus:border-theme-accent transition-colors"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-theme-accent/20 text-theme-accent flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-theme-accent hover:text-white transition-all"
            >
              ↑
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
