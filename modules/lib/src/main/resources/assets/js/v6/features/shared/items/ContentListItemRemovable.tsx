import {Button, cn, IconButton, ListItem} from '@enonic/ui';
import {X} from 'lucide-react';
import {type ComponentPropsWithoutRef, type ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {ContentLabel} from '../content/ContentLabel';
import {DiffStatusBadge} from '../status/DiffStatusBadge';

export type ContentListItemRemovableProps = {
    content: ContentSummaryAndCompareStatus;
    onRemove: () => void;
    disabled?: boolean;
    status?: boolean;
    className?: string;
    /**
     * TabIndex for interactive elements.
     * Set to -1 when used inside TreeList to enable F2 action mode navigation.
     */
    tabIndex?: number;
} & ComponentPropsWithoutRef<'div'>;

const CONTENT_LIST_ITEM_REMOVABLE_NAME = 'ContentListItemRemovable';

export const ContentListItemRemovable = ({
    content,
    onRemove,
    disabled = false,
    status = true,
    className,
    tabIndex,
    ...props
}: ContentListItemRemovableProps): ReactElement => {
    const handleClick = () => {
        new EditContentEvent([content]).fire();
    };

    const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onRemove();
    };

    return (
        <ListItem
            role='row'
            className={cn('py-0', className)}
            {...props}
        >
            <ListItem.Left>
                <IconButton
                    icon={X}
                    variant='text'
                    size='sm'
                    className='size-6'
                    title='Remove'
                    onClick={handleRemove}
                    disabled={disabled}
                    tabIndex={tabIndex}
                />
            </ListItem.Left>
            <ListItem.Content className='flex'>
                <Button onClick={handleClick} tabIndex={tabIndex} className='box-content justify-start flex-1 h-6 px-1.25 -ml-1.25 py-1'>
                    <ContentLabel content={content} variant='compact' />
                </Button>
            </ListItem.Content>
            <ListItem.Right>
                {status && <DiffStatusBadge
                    publishStatus={content.getPublishStatus()}
                    compareStatus={content.getCompareStatus()}
                    wasPublished={!!content.getContentSummary().getPublishFirstTime()} />}
            </ListItem.Right>
        </ListItem>
    );
};

ContentListItemRemovable.displayName = CONTENT_LIST_ITEM_REMOVABLE_NAME;
