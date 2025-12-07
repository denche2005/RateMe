
import React from 'react';
import { NeonButton, RateCoinIcon } from './NeonComponents';

interface Props {
  balance: number;
  onClose: () => void;
  onBuyItem: (item: { name: string, price: number }) => void;
}

export const StoreSheet: React.FC<Props> = ({ balance, onClose, onBuyItem }) => {
  const items = [
    { id: 1, name: 'Profile Boost', icon: '🚀', price: 500, desc: 'Get featured on the Explore page for 1h' },
    { id: 2, name: 'See Who Rated', icon: '👀', price: 1000, desc: 'Reveal the identity of your last 3 raters' },
    { id: 3, name: 'Golden Frame', icon: '🖼️', price: 2500, desc: 'Exclusive golden avatar border' },
    { id: 4, name: 'Vibe Check +', icon: '✨', price: 100, desc: 'Unlimited AI Vibe Checks' },
    { id: 5, name: 'Remove Ads', icon: '🚫', price: 5000, desc: 'Ad-free experience forever' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-theme-card rounded-t-3xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(125,42,232,0.15)] animate-[slideUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-theme-divider">
            <h2 className="text-xl font-black text-theme-text uppercase tracking-widest mb-1">Coin Store</h2>
            <div className="flex items-center justify-center gap-2">
                <RateCoinIcon className="w-8 h-8 text-xl" />
                <span className="text-3xl font-black text-transparent bg-clip-text bg-brand-gradient">{balance.toLocaleString()}</span>
            </div>
            <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-theme-bg flex items-center justify-center text-theme-secondary hover:text-theme-text">✕</button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
           {items.map(item => (
              <div key={item.id} className="bg-theme-bg border border-theme-divider rounded-2xl p-4 flex items-center gap-4 hover:border-theme-accent/50 transition-colors">
                 <div className="w-12 h-12 rounded-xl bg-theme-card flex items-center justify-center text-2xl shadow-sm">
                    {item.icon}
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-theme-text">{item.name}</h3>
                    <p className="text-xs text-theme-secondary">{item.desc}</p>
                 </div>
                 <NeonButton 
                    className="py-2 px-4 text-xs min-w-[80px]" 
                    disabled={balance < item.price}
                    style={{ opacity: balance < item.price ? 0.5 : 1 }}
                    onClick={() => onBuyItem(item)}
                 >
                    {item.price} RateCoins
                 </NeonButton>
              </div>
           ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme-divider bg-theme-bg rounded-t-2xl -mt-2 z-10">
           <p className="text-center text-[10px] text-theme-secondary uppercase tracking-widest">
              Get more coins by rating daily
           </p>
        </div>
      </div>
    </div>
  );
};
