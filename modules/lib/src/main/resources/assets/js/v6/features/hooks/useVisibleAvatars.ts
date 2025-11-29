import {RefObject} from 'react';
import {useLayoutEffect, useState} from 'react';
import {createDebounce} from '../utils/timing/createDebounce';

export function useVisibleAvatars(containerRef: RefObject<HTMLElement>, totalCount: number, offset: number = 20) {
    const [visibleCount, setVisibleCount] = useState(0);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const calculateVisible = () => {
            const containerRight = containerRef.current.getBoundingClientRect().right;
            const children = Array.from(containerRef.current.children);
            const visible = children.filter(
                (child) => child.getBoundingClientRect().right <= containerRight - offset
            ).length;
            setVisibleCount(visible);
        };

        const debouncedCalc = createDebounce(calculateVisible, 50);
        const observer = new ResizeObserver(debouncedCalc);
        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, [containerRef, totalCount]);

    return {visibleCount, extraCount: totalCount - visibleCount};
}
