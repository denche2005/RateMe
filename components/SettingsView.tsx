
import React, { useState } from 'react';
import { NeonButton, BackArrow } from './NeonComponents';
import { AppTheme } from '../types';

interface Props {
  currentScale: 5 | 10 | 100;
  isPrivate: boolean;
  onScaleChange: (scale: 5 | 10 | 100) => void;
  onPrivacyChange: (isPrivate: boolean) => void;
  onClose: () => void;
  
  // Theme Props
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

const THEME_OPTIONS: { id: AppTheme; name: string; gradient: string }[] = [
  { id: 'NEON', name: 'Cyber', gradient: 'linear-gradient(90deg, #06b6d4, #3b82f6)' },
  { id: 'EMERALD', name: 'Matrix', gradient: 'linear-gradient(90deg, #059669, #10b981)' },
  { id: 'SUNSET', name: 'Heat', gradient: 'linear-gradient(90deg, #f59e0b, #f43f5e)' },
  { id: 'LAVENDER', name: 'Haze', gradient: 'linear-gradient(90deg, #ec4899, #8b5cf6)' },
  { id: 'MONO', name: 'Noir', gradient: 'linear-gradient(90deg, #6b7280, #ffffff)' },
];

const SupportModal = ({ title, content, onClose }: { title: string, content: string, onClose: () => void }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in font-sans">
        <div className="bg-theme-card w-full max-w-md rounded-2xl flex flex-col max-h-[80vh] shadow-2xl border border-theme-divider">
            <div className="p-4 border-b border-theme-divider flex justify-between items-center">
                <h3 className="font-black text-xl text-theme-text">{title}</h3>
                <button onClick={onClose} className="text-theme-secondary hover:text-theme-text">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
                <p className="text-theme-text/80 text-sm whitespace-pre-wrap leading-relaxed font-sans">{content}</p>
            </div>
            <div className="p-4 border-t border-theme-divider">
                <NeonButton onClick={onClose} className="w-full">Close</NeonButton>
            </div>
        </div>
    </div>
);

export const SettingsView: React.FC<Props> = ({ 
  currentScale, 
  isPrivate, 
  onScaleChange, 
  onPrivacyChange, 
  onClose,
  currentTheme,
  onThemeChange,
  isDarkMode,
  onToggleDarkMode,
  onLogout
}) => {
  const [modalContent, setModalContent] = useState<{ title: string, text: string } | null>(null);

  const handleSupportClick = (type: 'HELP' | 'REPORT' | 'TERMS') => {
      let content = '';
      let title = '';

      switch (type) {
          case 'HELP':
              title = 'Help Center';
              content = `
Welcome to the RateMe Help Center.

1. How does rating work?
You can rate posts on a scale depending on your settings (1-5, 1-10, or 1-100). Swipe the star slider to give your score.

2. What are RateCoins?
RateCoins are earned by engaging with the app, rating others, and maintaining a daily streak. You can use coins to unlock special profile features.

3. Is my rating anonymous?
Yes, your ratings on posts are anonymous unless you choose to reveal them via comments. However, "Describe Me" badge ratings are aggregated.

4. Can I delete my account?
Please contact support@rateme.app to request account deletion.
              `;
              break;
          case 'REPORT':
              title = 'Report a Problem';
              content = `
Found a bug or encountered inappropriate content?

Please detail the issue and our moderation team will review it within 24 hours.

If this is an emergency, please use the in-app reporting tool on the specific post or profile.

For technical bugs, email bugs@rateme.app with your device model and OS version.
              `;
              break;
          case 'TERMS':
              title = 'Terms of Service';
              content = `
Last Updated: October 2023

1. Acceptance of Terms
By accessing RateMe, you agree to be bound by these Terms of Service.

2. User Conduct
You agree not to use the service to harass, abuse, or harm another person. Hate speech and explicit content are strictly prohibited.

3. Privacy
We respect your privacy. Your data is used to improve the rating algorithm and is never sold to third parties without consent.

4. Termination
We reserve the right to terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms.
              `;
              break;
      }
      setModalContent({ title, text: content });
  };

  return (
    <div className="fixed inset-0 z-50 bg-theme-bg flex flex-col animate-fade-in overflow-y-auto font-sans">
      {modalContent && (
          <SupportModal 
            title={modalContent.title} 
            content={modalContent.text} 
            onClose={() => setModalContent(null)} 
          />
      )}

      {/* Header */}
      <div className="p-4 border-b border-theme-divider flex items-center sticky top-0 bg-theme-bg/95 backdrop-blur-md z-10 pt-12">
        <BackArrow onClick={onClose} />
        <h1 className="text-xl font-black ml-4 text-theme-text">Settings</h1>
      </div>

      <div className="p-6 space-y-8 max-w-2xl mx-auto w-full pb-24">
        
        {/* Appearance Section */}
        <section>
            <h2 className="text-sm font-bold text-theme-secondary uppercase tracking-widest mb-4">Appearance</h2>
            <div className="bg-theme-card rounded-2xl p-6 border border-theme-divider shadow-sm space-y-6">
                
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-theme-text text-lg">Dark Mode</h3>
                        <p className="text-sm text-theme-secondary">Easy on the eyes.</p>
                    </div>
                    <button 
                        onClick={onToggleDarkMode}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${isDarkMode ? 'bg-theme-accent' : 'bg-gray-400'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                {/* Theme Selector */}
                <div>
                    <h3 className="font-bold text-theme-text text-lg mb-3">Color Style</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {THEME_OPTIONS.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => onThemeChange(theme.id)}
                                className={`flex flex-col items-center gap-2 group`}
                            >
                                <div 
                                    className={`w-10 h-10 rounded-full shadow-md transition-transform duration-200 ${currentTheme === theme.id ? 'scale-110 ring-2 ring-theme-text ring-offset-2 ring-offset-theme-card' : 'hover:scale-105'}`}
                                    style={{ background: theme.gradient }}
                                ></div>
                                <span className={`text-[10px] font-bold uppercase ${currentTheme === theme.id ? 'text-theme-accent' : 'text-theme-secondary'}`}>
                                    {theme.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </section>

        {/* Privacy Section */}
        <section>
            <h2 className="text-sm font-bold text-theme-secondary uppercase tracking-widest mb-4">Privacy & Security</h2>
            <div className="bg-theme-card rounded-2xl p-6 border border-theme-divider shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-theme-text text-lg">Private Account</h3>
                        <p className="text-sm text-theme-secondary">Only followers can see your posts and rating.</p>
                    </div>
                    
                    <button 
                        onClick={() => onPrivacyChange(!isPrivate)}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${isPrivate ? 'bg-theme-accent' : 'bg-gray-700'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isPrivate ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
            </div>
        </section>

        {/* Rating Scale Section */}
        <section>
           <h2 className="text-sm font-bold text-theme-secondary uppercase tracking-widest mb-4">Rating System</h2>
           <div className="bg-theme-card rounded-2xl p-6 border border-theme-divider shadow-sm">
              <div className="mb-4">
                 <h3 className="font-bold text-theme-text text-lg">Precision Scale</h3>
                 <p className="text-sm text-theme-secondary">How detailed do you want to be?</p>
              </div>
              
              <div className="flex gap-2 p-1 bg-theme-bg rounded-xl border border-theme-divider">
                 {[5, 10, 100].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => onScaleChange(scale as 5 | 10 | 100)}
                      className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-300 ${
                        currentScale === scale 
                        ? 'bg-brand-gradient text-white shadow-md' 
                        : 'text-theme-secondary hover:text-theme-text'
                      }`}
                    >
                      0 - {scale}
                    </button>
                 ))}
              </div>
           </div>
        </section>

        {/* Support Section */}
        <section>
           <h2 className="text-sm font-bold text-theme-secondary uppercase tracking-widest mb-4">Support</h2>
           <div className="bg-theme-card rounded-2xl border border-theme-divider shadow-sm divide-y divide-theme-divider overflow-hidden">
              <button onClick={() => handleSupportClick('HELP')} className="w-full text-left p-4 text-theme-text font-medium hover:bg-theme-bg/50 transition-colors flex justify-between items-center">
                  Help Center <span className="text-theme-secondary">›</span>
              </button>
              <button onClick={() => handleSupportClick('REPORT')} className="w-full text-left p-4 text-theme-text font-medium hover:bg-theme-bg/50 transition-colors flex justify-between items-center">
                  Report a Problem <span className="text-theme-secondary">›</span>
              </button>
              <button onClick={() => handleSupportClick('TERMS')} className="w-full text-left p-4 text-theme-text font-medium hover:bg-theme-bg/50 transition-colors flex justify-between items-center">
                  Terms of Service <span className="text-theme-secondary">›</span>
              </button>
           </div>
        </section>
        
        <div className="text-center pt-4 pb-8">
           <NeonButton 
             variant="secondary" 
             className="w-full text-red-500 border-red-500/20 hover:bg-red-500/10"
             onClick={onLogout}
           >
              Log Out
           </NeonButton>
           <p className="mt-4 text-[10px] text-theme-secondary uppercase tracking-widest">RateMe Version 2.0</p>
        </div>

      </div>
    </div>
  );
};
