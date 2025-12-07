
import React from 'react';
import { User } from '../types';
import { Avatar } from './NeonComponents';

interface Props {
  type: 'FOLLOWERS' | 'FOLLOWING';
  users: User[];
  onClose: () => void;
  onUserClick: (user: User) => void;
}

export const UserListSheet: React.FC<Props> = ({ type, users, onClose, onUserClick }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="relative w-full max-w-md bg-theme-card rounded-t-3xl h-[80vh] flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out]">
        
        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-500/50 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-theme-divider flex justify-between items-center">
            <h3 className="font-bold text-theme-text text-center w-full uppercase tracking-widest text-sm">
                {type === 'FOLLOWERS' ? 'Followers' : 'Following'}
            </h3>
            <button onClick={onClose} className="absolute right-4 text-theme-secondary hover:text-theme-text">✕</button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
           {users.map(user => (
             <div 
                key={user.id} 
                onClick={() => onUserClick(user)}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-theme-bg/50 cursor-pointer transition-colors"
             >
                <Avatar url={user.avatarUrl} size="md" />
                <div className="flex-1">
                   <div className="font-bold text-theme-text text-sm">{user.displayName}</div>
                   <div className="text-xs text-theme-secondary">@{user.username}</div>
                </div>
                <div className="text-lg font-black text-transparent bg-clip-text bg-brand-gradient">
                   {user.averageScore.toFixed(1)}
                </div>
             </div>
           ))}
           {users.length === 0 && (
             <div className="text-center text-theme-secondary mt-20 opacity-50">
                <div className="text-4xl mb-2">🔭</div>
                <p>No users found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
