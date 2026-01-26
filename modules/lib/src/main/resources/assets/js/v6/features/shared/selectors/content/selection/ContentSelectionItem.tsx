import {IconButton, cn} from '@enonic/ui';
import {X} from 'lucide-react';
import type {ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentLabel} from '../../../content/ContentLabel';
import {StatusBadge} from '../../../status/StatusBadge';

//
// * Types
//

export type ContentSelectionItemProps = {
    /** The content item to display */
    content: ContentSummaryAndCompareStatus;
    /** Callback when remove is clicked */
    onRemove?: (id: string) => void;
    /** Whether interactions are disabled */
    disabled?: boolean;
    /** Additional CSS class */
    className?: string;
};

//
// * Constants
//

const CONTENT_SELECTION_ITEM_NAME = 'ContentSelectionItem';

//
// * Component
//

/**
 * Single selected content item with remove action.
 * Displays content icon, name, path, status badge, and remove button.
 */
export const ContentSelectionItem = ({
    content,
    onRemove,
    disabled = false,
    className,
}: ContentSelectionItemProps): ReactElement => {
    const id = content.getId();

    return (
        <li
            data-component={CONTENT_SELECTION_ITEM_NAME}
            data-content-id={id}
            className={cn('flex items-center gap-2.5', className)}
        >
            <ContentLabel content={content} className='flex-1 min-w-0' />
            <StatusBadge status={content.getPublishStatus()} />
            <IconButton
                icon={X}
                size='sm'
                variant='text'
                iconSize={18}
                iconStrokeWidth={2}
                onClick={(event) => {
                    event.stopPropagation();
                    onRemove?.(id);
                }}
                disabled={disabled}
                aria-label='Remove'
            />
        </li>
    );
};

ContentSelectionItem.displayName = CONTENT_SELECTION_ITEM_NAME;
