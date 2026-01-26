import {useEffect, useMemo, useRef, useState} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {hasUnpublishedChildren} from '../../../api/hasUnpublishedChildren';

export const useItemsWithUnpublishedChildren = (
    items: ContentSummaryAndCompareStatus[],
): Set<string> | null => {
    const [itemsWithUnpublishedChildren, setItemsWithUnpublishedChildren] = useState<Set<string> | null>(null);
    const requestIdRef = useRef(0);

    const itemsWithChildren = useMemo(
        () => items.filter(item => item.hasChildren()),
        [items],
    );

    useEffect(() => {
        const requestId = ++requestIdRef.current;

        if (itemsWithChildren.length === 0) {
            setItemsWithUnpublishedChildren(new Set());
            return;
        }

        setItemsWithUnpublishedChildren(null);

        hasUnpublishedChildren(itemsWithChildren.map(item => item.getContentId()))
            .then((result) => {
                if (requestId !== requestIdRef.current) {
                    return;
                }
                const set = new Set<string>();
                for (const [id, hasChildren] of result) {
                    if (hasChildren) {
                        set.add(id);
                    }
                }
                setItemsWithUnpublishedChildren(set);
            })
            .catch((error) => {
                console.error(error);
                if (requestId === requestIdRef.current) {
                    setItemsWithUnpublishedChildren(null);
                }
            });
    }, [itemsWithChildren]);

    return itemsWithUnpublishedChildren;
};
