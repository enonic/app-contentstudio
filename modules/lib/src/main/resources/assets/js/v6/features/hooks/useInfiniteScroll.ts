import {useEffect, useRef} from 'react';

/**
 * Hook for infinite scroll using Intersection Observer API
 */
type UseInfiniteScrollOptions = {
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
    rootMargin?: string;
    threshold?: number;
}

export const useInfiniteScroll = <T extends HTMLElement>({
    hasMore,
    isLoading,
    onLoadMore,
    rootMargin = '200px',
    threshold = 0.1
}: UseInfiniteScrollOptions) => {
    const observerRef = useRef<T | null>(null);

    useEffect(() => {
        if (!hasMore || isLoading) return;

        const node = observerRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    onLoadMore();
                }
            },
            {
                root: null,
                rootMargin,
                threshold
            }
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [hasMore, isLoading, onLoadMore, rootMargin, threshold]);

    return observerRef;
};

