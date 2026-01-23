import {IconButton} from '@enonic/ui';
import {X} from 'lucide-react';
import {useEffect, useMemo, useRef, useState, type ReactElement} from 'react';
import type {ContentId} from '../../../../../app/content/ContentId';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {hasUnpublishedChildren} from '../../../api/hasUnpublishedChildren';
import {ContentListItemWithChildren} from '../../items/ContentListItemWithChildren';

export type IssueSelectedItemsProps = {
    items: ContentSummaryAndCompareStatus[];
    excludedChildrenIds: ContentId[];
    disabled?: boolean;
    loading?: boolean;
    onIncludeChildrenChange?: (id: ContentId, includeChildren: boolean) => void;
    onRemoveItem?: (id: ContentId) => void;
};

const ISSUE_SELECTED_ITEMS_NAME = 'IssueSelectedItems';

export const IssueSelectedItems = ({
                                       items,
                                       excludedChildrenIds,
                                       disabled = false,
                                       loading = false,
                                       onIncludeChildrenChange,
                                       onRemoveItem,
                                   }: IssueSelectedItemsProps): ReactElement => {
    const excludedChildrenSet = useMemo(
        () => new Set(excludedChildrenIds.map(id => id.toString())),
        [excludedChildrenIds],
    );
    const isReadOnly = disabled || loading;
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

    return (
        <ul className='flex flex-col gap-2.5'>
            {items.map(item => {
                const id = item.getContentId();
                const includeChildren = !excludedChildrenSet.has(id.toString());
                const hasUnpublishedChildrenForItem = itemsWithUnpublishedChildren
                                                      ? itemsWithUnpublishedChildren.has(id.toString())
                                                      : true;

                return (
                    <ContentListItemWithChildren
                        key={item.getId()}
                        content={item}
                        includeChildren={includeChildren}
                        onIncludeChildrenChange={(checked) => onIncludeChildrenChange?.(id, checked)}
                        readOnly={isReadOnly}
                        rightSlotOrder='after-status'
                        showIncludeChildren={hasUnpublishedChildrenForItem}
                    >
                        <IconButton
                            icon={X}
                            size='sm'
                            variant='text'
                            iconSize={18}
                            iconStrokeWidth={2}
                            onClick={(event) => {
                                event.stopPropagation();
                                onRemoveItem?.(id);
                            }}
                            disabled={isReadOnly}
                        />
                    </ContentListItemWithChildren>
                );
            })}
        </ul>
    );
};

IssueSelectedItems.displayName = ISSUE_SELECTED_ITEMS_NAME;
