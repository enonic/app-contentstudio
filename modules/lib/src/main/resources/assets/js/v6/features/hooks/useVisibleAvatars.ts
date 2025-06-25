import {RefObject} from 'react';
import {useLayoutEffect, useState} from 'react';
import {createThrottle} from '../utils/timing/createThrottle';

export function useVisibleAvatars(containerRef: RefObject<HTMLElement>, totalCount: number, offset = 20) {
    const [visibleCount, setVisibleCount] = useState(0);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const calculateVisible = () => {
            if (!containerRef.current) return;
            const containerRight = containerRef.current.getBoundingClientRect().right;
            const children = Array.from(containerRef.current.children);
            const visible = children.filter(
                (child) => child.getBoundingClientRect().right <= containerRight - offset
            ).length;
            setVisibleCount(visible);
        };

        // Calculate immediately on mount
        calculateVisible();

        const throttledCalc = createThrottle(calculateVisible, 50);
        const observer = new ResizeObserver(throttledCalc);
        observer.observe(container);

        return () => {
            observer.disconnect();
            throttledCalc.cancel();
        };
    }, [containerRef, offset]);

    return {visibleCount, extraCount: totalCount - visibleCount};
}
