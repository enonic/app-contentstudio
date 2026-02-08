import {IconButton} from '@enonic/ui';
import {X} from 'lucide-react';
import {useMemo, type ReactElement} from 'react';
import type {ContentId} from '../../../../../app/content/ContentId';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {useItemsWithUnpublishedChildren} from '../../../utils/cms/content/useItemsWithUnpublishedChildren';
import {ContentListItemWithChildren} from '../../items';

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
    const itemsWithUnpublishedChildren = useItemsWithUnpublishedChildren(items);

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
                        id={item.getId()}
                        key={item.getId()}
                        content={item}
                        variant='detailed'
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
                            disabled={isReadOnly || items.length === 1}
                        />
                    </ContentListItemWithChildren>
                );
            })}
        </ul>
    );
};

IssueSelectedItems.displayName = ISSUE_SELECTED_ITEMS_NAME;
