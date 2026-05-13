import {type PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {useEffect, useRef} from 'react';

const SCROLL_OFFSET = 10;

type UseScrollPanelToOccurrenceReturn = {
    setOccurrenceRef: (index: number, node: HTMLDivElement | null) => void;
    scheduleScrollTo: (index: number) => void;
};

export function useScrollPanelToOccurrence(propertySets: PropertySet[]): UseScrollPanelToOccurrenceReturn {
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const pendingScrollIndex = useRef<number | null>(null);
    const pendingTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const index = pendingScrollIndex.current;
        if (index == null) return;
        pendingScrollIndex.current = null;
        if (pendingTimeoutId.current != null) clearTimeout(pendingTimeoutId.current);
        pendingTimeoutId.current = setTimeout(() => scrollPanelToOccurrence(itemRefs.current, index), 100);
    }, [propertySets]);

    useEffect(() => {
        return () => {
            if (pendingTimeoutId.current != null) clearTimeout(pendingTimeoutId.current);
        };
    }, []);

    const setOccurrenceRef = (index: number, node: HTMLDivElement | null): void => {
        if (node) itemRefs.current.set(index, node);
        else itemRefs.current.delete(index);
    };

    const scheduleScrollTo = (index: number): void => {
        pendingScrollIndex.current = index;
    };

    return {setOccurrenceRef, scheduleScrollTo};
}

function scrollPanelToOccurrence(refs: Map<number, HTMLDivElement>, index: number): void {
    const ref = refs.get(index);
    if (!ref) return;

    const panel = ref.closest('.form-panel');
    if (!panel) return;

    const top = ref.getBoundingClientRect().top - panel.getBoundingClientRect().top - SCROLL_OFFSET;

    panel.scrollBy({top, behavior: 'smooth'});
}
