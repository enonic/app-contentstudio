import {useCallback, useEffect, useRef, type RefObject} from 'react';
import {ensureSortDialogBatchLoaded} from '../store/dialogs/sortDialog.store';
import {useDebouncedCallback} from '../utils/hooks/useDebouncedCallback';

type RegisterRow = (index: number) => (node: HTMLElement | null) => void;

/**
 * Lazily loads SortDialog content in batches as skeleton rows scroll into view.
 * Returns a per-index ref callback to attach to each not-yet-loaded row.
 */
export function useSortDialogBatchLoader(rootRef: RefObject<HTMLElement | null>): RegisterRow {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const indexByElement = useRef(new WeakMap<Element, number>());
    const elementByIndex = useRef(new Map<number, Element>());
    const visibleIndices = useRef(new Set<number>());

    const flush = useDebouncedCallback(() => {
        visibleIndices.current.forEach(index => {
            void ensureSortDialogBatchLoaded(index);
        });
    }, 100);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    const index = indexByElement.current.get(entry.target);
                    if (index == null) return;
                    if (entry.isIntersecting) {
                        visibleIndices.current.add(index);
                    } else {
                        visibleIndices.current.delete(index);
                    }
                });
                flush();
            },
            {root: rootRef.current, rootMargin: '200px 0px'},
        );
        observerRef.current = observer;

        elementByIndex.current.forEach(element => observer.observe(element));

        return () => {
            observer.disconnect();
            observerRef.current = null;
            visibleIndices.current.clear();
        };
    }, [rootRef, flush]);

    return useCallback((index: number) => (node: HTMLElement | null) => {
        const observer = observerRef.current;
        const prev = elementByIndex.current.get(index);

        if (prev && prev !== node) {
            observer?.unobserve(prev);
            indexByElement.current.delete(prev);
            elementByIndex.current.delete(index);
            visibleIndices.current.delete(index);
        }

        if (node) {
            elementByIndex.current.set(index, node);
            indexByElement.current.set(node, index);
            observer?.observe(node);
        }
    }, []);
}
