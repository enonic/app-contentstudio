import {GridList, IconButton} from '@enonic/ui';
import {X} from 'lucide-react';
import type {ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../../../app/event/EditContentEvent';
import {ContentButton} from '../../../content/ContentButton';
import {StatusBadge} from '../../../status/StatusBadge';
import {useI18n} from '../../../../hooks/useI18n';

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
 * Single selected content item row for GridList.
 * Left cell: clickable content label (opens content for editing).
 * Right cell: status badge and remove button.
 */
export const ContentSelectionItem = ({
    content,
    onRemove,
    disabled = false,
    className,
}: ContentSelectionItemProps): ReactElement => {
    const id = content.getId();
    const removeLabel = useI18n('action.remove');

    const handleRowClick = () => {
        if (!disabled) {
            new EditContentEvent([content]).fire();
        }
    };

    return (
        <GridList.Row
            data-component={CONTENT_SELECTION_ITEM_NAME}
            data-content-id={id}
            id={id}
            disabled={disabled}
            className={className ?? 'gap-3 px-2.5'}
            onClick={handleRowClick}
        >
            <GridList.Cell className='flex-1 min-w-0'>
                <GridList.Action>
                    <ContentButton content={content} disabled={disabled} />
                </GridList.Action>
            </GridList.Cell>
            <GridList.Cell>
                <StatusBadge status={content.getPublishStatus()} />
            </GridList.Cell>
            <GridList.Cell>
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
                    aria-label={removeLabel || 'Remove'}
                />
            </GridList.Cell>
        </GridList.Row>
    );
};

ContentSelectionItem.displayName = CONTENT_SELECTION_ITEM_NAME;
