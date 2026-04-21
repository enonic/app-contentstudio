import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {PropertyAddedEvent} from '@enonic/lib-admin-ui/data/PropertyAddedEvent';
import type {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import type {PropertyMovedEvent} from '@enonic/lib-admin-ui/data/PropertyMovedEvent';
import type {PropertyRemovedEvent} from '@enonic/lib-admin-ui/data/PropertyRemovedEvent';

export type UseSetExpandedReturn = {
    expanded: Map<number, boolean>;
    isAllExpanded: boolean;
    handleExpandAll: () => void;
    handleCollapseAll: () => void;
    handleDragStart: () => void;
    handleToggleSingle: (index: number) => void;
};

/**
 * Owns the per-occurrence expanded/collapsed state for a set view and keeps it
 * consistent with add/move/remove events on the underlying `PropertyArray`.
 * Needed because expansion must follow occurrences across reorders (drag, add
 * above/below) rather than sticking to an index.
 */
export const useSetExpanded = (propertyArray: PropertyArray, size: number): UseSetExpandedReturn => {
    const [expanded, setExpanded] = useState(() => sizeToMap(size, false));
    const dragSnapshotRef = useRef<Map<number, boolean> | null>(null);

    useEffect(() => {
        if (size !== 1) return;
        setExpanded(new Map([[0, true]]));
    }, [size]);

    useEffect(() => {
        const parent = propertyArray.getParent();
        const name = propertyArray.getName();

        const addedHandler = (event: PropertyAddedEvent) => {
            const property = event.getProperty();
            if (property.getParent() !== parent || property.getName() !== name) return;

            const addedIndex = property.getIndex();
            const nextSize = propertyArray.getSize();
            const newMap = sizeToMap(nextSize, false);
            newMap.set(addedIndex, true);
            setExpanded(newMap);
        };

        const movedHandler = (event: PropertyMovedEvent) => {
            const property = event.getProperty();
            if (property.getParent() !== parent || property.getName() !== name) return;

            const fromIndex = event.getFrom();
            const toIndex = event.getTo();
            const nextSize = propertyArray.getSize();
            const dragSnapshot = dragSnapshotRef.current;
            dragSnapshotRef.current = null;

            if (dragSnapshot != null) {
                const values: boolean[] = Array.from({length: nextSize}, (_, i) => dragSnapshot.get(i) ?? false);
                const [moved] = values.splice(fromIndex, 1);
                values.splice(toIndex, 0, moved);
                setExpanded(new Map(values.map((v, i) => [i, v])));
                return;
            }

            const newMap = sizeToMap(nextSize, false);
            newMap.set(toIndex, true);
            setExpanded(newMap);
        };

        const removedHandler = (event: PropertyRemovedEvent) => {
            const property = event.getProperty();
            if (property.getParent() !== parent || property.getName() !== name) return;

            const removedIndex = property.getIndex();
            setExpanded((prev) => {
                const next = new Map<number, boolean>();
                prev.forEach((value, key) => {
                    if (key < removedIndex) next.set(key, value);
                    else if (key > removedIndex) next.set(key - 1, value);
                });
                return next;
            });
        };

        propertyArray.onPropertyAdded(addedHandler);
        propertyArray.onPropertyMoved(movedHandler);
        propertyArray.onPropertyRemoved(removedHandler);

        return () => {
            propertyArray.unPropertyAdded(addedHandler);
            propertyArray.unPropertyMoved(movedHandler);
            propertyArray.unPropertyRemoved(removedHandler);
        };
    }, [propertyArray]);

    const isAllExpanded = useMemo(() => {
        if (size === 0) return false;
        for (let i = 0; i < size; i++) {
            if (!expanded.get(i)) return false;
        }
        return true;
    }, [expanded, size]);

    const handleExpandAll = useCallback(() => {
        setExpanded(sizeToMap(size));
    }, [size]);

    const handleCollapseAll = useCallback(() => {
        setExpanded(sizeToMap(size, false));
    }, [size]);

    const handleDragStart = useCallback(() => {
        setExpanded((prev) => {
            dragSnapshotRef.current = prev;
            return sizeToMap(size, false);
        });
    }, [size]);

    const handleToggleSingle = useCallback((index: number) => {
        setExpanded((prev) => {
            const newMap = new Map(prev);
            newMap.set(index, !prev.get(index));
            return newMap;
        });
    }, []);

    return {expanded, isAllExpanded, handleExpandAll, handleCollapseAll, handleDragStart, handleToggleSingle};
};

function sizeToMap(size: number, value: boolean = true): Map<number, boolean> {
    return new Map(Array.from({length: size}, (_, index) => [index, value]));
}
