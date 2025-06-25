import {useEffect, useState} from 'react';

export type Breakpoints = {
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
    xxl: boolean;
};

const BP_QUERIES = {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
    xxl: '(min-width: 1536px)',
} as const;

const DEFAULT_BREAKPOINTS: Breakpoints = {
    sm: false,
    md: false,
    lg: false,
    xl: false,
    xxl: false,
};

const getBreakpoints = (): Breakpoints => {
    if (typeof window === 'undefined') {
        return DEFAULT_BREAKPOINTS;
    }

    return {
        sm: window.matchMedia(BP_QUERIES.sm).matches,
        md: window.matchMedia(BP_QUERIES.md).matches,
        lg: window.matchMedia(BP_QUERIES.lg).matches,
        xl: window.matchMedia(BP_QUERIES.xl).matches,
        xxl: window.matchMedia(BP_QUERIES.xxl).matches,
    };
};

export const useBreakpoints = (): Breakpoints => {
    const [breakpoints, setBreakpoints] = useState<Breakpoints>(getBreakpoints);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQueries = Object.values(BP_QUERIES).map((query: string) => window.matchMedia(query));
        const update = (): void => setBreakpoints(getBreakpoints());

        update();
        mediaQueries.forEach((mediaQuery: MediaQueryList) => {
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', update);
            } else if (mediaQuery.addListener) {
                mediaQuery.addListener(update);
            }
        });

        return () => {
            mediaQueries.forEach((mediaQuery: MediaQueryList) => {
                if (mediaQuery.removeEventListener) {
                    mediaQuery.removeEventListener('change', update);
                } else if (mediaQuery.removeListener) {
                    mediaQuery.removeListener(update);
                }
            });
        };
    }, []);

    return breakpoints;
};

