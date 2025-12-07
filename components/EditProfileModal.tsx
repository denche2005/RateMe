
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { NeonButton, Avatar } from './NeonComponents';

interface Props {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<Props> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    displayName: user.displayName,
    bio: user.bio,
    age: user.age || '',
    nation: user.nation || '',
    avatarUrl: user.avatarUrl
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({
      ...user,
      displayName: formData.displayName,
      bio: formData.bio,
      age: formData.age ? Number(formData.age) : undefined,
      nation: formData.nation,
      avatarUrl: formData.avatarUrl
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-theme-card w-full max-w-md rounded-2xl flex flex-col border border-theme-divider shadow-2xl max-h-[90vh] overflow-hidden">
        
        <div className="p-4 border-b border-theme-divider flex justify-between items-center bg-theme-bg/50">
          <h2 className="text-lg font-black text-theme-text uppercase tracking-wide">Edit Profile</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-theme-bg text-theme-secondary hover:text-theme-text flex items-center justify-center">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Avatar Edit */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar url={formData.avatarUrl} size="xl" border={true} />
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold uppercase">Change</span>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Display Name</label>
              <input 
                type="text" 
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full bg-theme-bg border border-theme-divider rounded-xl px-4 py-3 text-theme-text focus:border-theme-accent focus:outline-none transition-colors"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Bio</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full bg-theme-bg border border-theme-divider rounded-xl px-4 py-3 text-theme-text focus:border-theme-accent focus:outline-none transition-colors h-24 resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Age</label>
                <input 
                  type="number" 
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full bg-theme-bg border border-theme-divider rounded-xl px-4 py-3 text-theme-text focus:border-theme-accent focus:outline-none transition-colors"
                  placeholder="24"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Location</label>
                <input 
                  type="text" 
                  value={formData.nation}
                  onChange={(e) => setFormData(prev => ({ ...prev, nation: e.target.value }))}
                  className="w-full bg-theme-bg border border-theme-divider rounded-xl px-4 py-3 text-theme-text focus:border-theme-accent focus:outline-none transition-colors"
                  placeholder="Global"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-theme-divider bg-theme-bg/50">
          <NeonButton onClick={handleSave} className="w-full py-3">
             Save Changes
          </NeonButton>
        </div>

      </div>
    </div>
  );
};
