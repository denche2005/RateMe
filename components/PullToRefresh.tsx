import React, { useState } from 'react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const touchStartY = React.useRef(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        const container = containerRef.current;
        if (container && container.scrollTop === 0) {
            touchStartY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const container = containerRef.current;
        if (container && container.scrollTop === 0 && !isRefreshing) {
            const touchY = e.touches[0].clientY;
            const distance = touchY - touchStartY.current;

            if (distance > 0) {
                setPullDistance(Math.min(distance, 100));
                if (distance > 10) {
                    e.preventDefault();
                }
            }
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance > 60 && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(0);

            try {
                await onRefresh();
            } catch (error) {
                console.error('Refresh failed:', error);
            } finally {
                setIsRefreshing(false);
            }
        } else {
            setPullDistance(0);
        }
    };

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* Pull indicator */}
            <div
                className="absolute top-0 left-0 right-0 flex items-center justify-center transition-opacity z-50"
                style={{
                    height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
                    opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
                }}
            >
                <div className="text-white text-sm flex flex-col items-center gap-1 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                    {isRefreshing ? (
                        <>
                            <div className="animate-spin">⟳</div>
                            <span className="font-bold">Refreshing...</span>
                        </>
                    ) : pullDistance > 60 ? (
                        <>
                            <div>↓</div>
                            <span className="font-bold">Release to refresh</span>
                        </>
                    ) : (
                        <>
                            <div>↓</div>
                            <span className="font-bold">Pull to refresh</span>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div
                ref={containerRef}
                className="h-full w-full"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    transform: `translateY(${pullDistance || (isRefreshing ? 60 : 0)}px)`,
                    transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
                }}
            >
                {children}
            </div>
        </div>
    );
};
