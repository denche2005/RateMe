
import React, { useState } from 'react';
import { User } from '../types';
import { Avatar, NeonButton } from './NeonComponents';

interface Props {
  users: User[];
  onClose: () => void;
  onSend?: (selectedIds: string[]) => void;
}

export const ShareSheet: React.FC<Props> = ({ users, onClose, onSend }) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const shareOptions = [
    { label: 'Copy Link', icon: '🔗', color: 'bg-gray-700' },
    { label: 'WhatsApp', icon: '💬', color: 'bg-green-500' },
    { label: 'Instagram', icon: '📸', color: 'bg-pink-500' },
    { label: 'Twitter', icon: '🐦', color: 'bg-blue-400' },
    { label: 'SMS', icon: '✉️', color: 'bg-blue-500' },
    { label: 'Messenger', icon: '⚡️', color: 'bg-purple-500' },
  ];

  const friends = users.slice(0, 10); // Show more friends

  const toggleUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(uid => uid !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleSend = () => {
    if (onSend && selectedUserIds.length > 0) {
      onSend(selectedUserIds);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
       
       <div className="relative w-full max-w-md bg-theme-card rounded-t-3xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] max-h-[85vh] flex flex-col">
          <div className="w-12 h-1.5 bg-gray-500/50 rounded-full mx-auto mb-6 shrink-0"></div>
          
          <h3 className="font-bold text-theme-text mb-4">Send to</h3>
          
          {/* Scrollable Friends Grid */}
          <div className="overflow-y-auto no-scrollbar mb-6 flex-1">
             <div className="grid grid-cols-4 gap-4">
                {friends.map(u => {
                   const isSelected = selectedUserIds.includes(u.id);
                   return (
                     <div 
                        key={u.id} 
                        onClick={() => toggleUser(u.id)}
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                     >
                        <div className="relative">
                          <Avatar url={u.avatarUrl} size="md" border={isSelected} />
                          {isSelected && (
                             <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-theme-accent rounded-full border-2 border-theme-card flex items-center justify-center text-white text-xs">
                               ✓
                             </div>
                          )}
                        </div>
                        <span className={`text-xs truncate w-full text-center transition-colors ${isSelected ? 'text-theme-accent font-bold' : 'text-theme-secondary'}`}>
                           {u.displayName.split(' ')[0]}
                        </span>
                     </div>
                   );
                })}
             </div>
          </div>

          <div className="shrink-0">
             <h3 className="font-bold text-theme-text mb-4">Share to Apps</h3>
             <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 mb-2">
                {shareOptions.map((opt, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer hover:scale-105 transition-transform">
                      <div className={`w-12 h-12 rounded-full ${opt.color} flex items-center justify-center text-xl text-white shadow-lg`}>
                          {opt.icon}
                      </div>
                      <span className="text-xs text-theme-secondary">{opt.label}</span>
                    </div>
                ))}
             </div>

             {/* Send Button */}
             <NeonButton 
               onClick={handleSend} 
               disabled={selectedUserIds.length === 0}
               className="w-full py-3 mb-2 shadow-lg"
             >
               {selectedUserIds.length === 0 
                  ? 'Select people to send' 
                  : `Send to ${selectedUserIds.length} ${selectedUserIds.length === 1 ? 'person' : 'people'} ➤`
               }
             </NeonButton>
          </div>
       </div>
    </div>
  );
};
