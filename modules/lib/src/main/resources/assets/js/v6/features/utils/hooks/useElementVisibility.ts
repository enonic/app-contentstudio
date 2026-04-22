import {type RefObject, useLayoutEffect, useRef, useState} from 'react';
import {getIsElementVisible} from '../dom/getIsElementVisible';

export const useElementVisibility = <T extends HTMLElement>(): [RefObject<T | null>, boolean] => {
    const ref = useRef<T | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        const updateVisibility = () => {
            setIsVisible(getIsElementVisible(element));
        };

        updateVisibility();
        const animationFrameId = requestAnimationFrame(updateVisibility);
        const observer = new ResizeObserver(updateVisibility);
        observer.observe(element);
        window.addEventListener('resize', updateVisibility);

        return () => {
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
            window.removeEventListener('resize', updateVisibility);
        };
    }, []);

    return [ref, isVisible];
};
