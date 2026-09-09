import { Button, cn, ListItem, type ButtonProps, type ListItemProps } from '@enonic/ui';
import React, { type ReactNode, type Ref } from 'react';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { EditContentEvent } from '../../../../../app/event/EditContentEvent';
import { ContentLabel, type ContentLabelVariant } from '../content/ContentLabel';
import { LegacyElement } from '../../../../shared/ui/LegacyElement';
import { DiffStatusBadge } from '../../../../features/shared/status/DiffStatusBadge';

export type ContentButtonProps = Omit<ButtonProps, 'children'> & {
    'data-active'?: boolean;
};

export type ContentItemProps = {
    content: ContentSummary;
    variant?: ContentLabelVariant;
    statusBelowLabelBelowSm?: boolean;
    rightSlotAfterStatusBelowSm?: boolean;
    rightSlotOrder?: 'before-status' | 'after-status';
    contentButtonProps?: ContentButtonProps;
    contentButtonRef?: Ref<HTMLButtonElement>;
    'data-component'?: string;
    children?: ReactNode;
} & Omit<ListItemProps, 'children'>;

const CONTENT_LIST_ITEM_NAME = 'ContentListItem';

export const ContentListItem = ({
    content,
    variant,
    statusBelowLabelBelowSm = false,
    rightSlotAfterStatusBelowSm = false,
    rightSlotOrder = 'before-status',
    selected = false,
    className,
    contentButtonProps,
    contentButtonRef,
    children,
    'data-component': componentName = CONTENT_LIST_ITEM_NAME,
    ...props
}: ContentItemProps): React.ReactElement => {
    const isCompact = variant === 'compact';
    const {
        className: contentButtonClassName,
        onClick: onContentButtonClick,
        ...restContentButtonProps
    } = contentButtonProps ?? {};

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onContentButtonClick?.(event);
        if (event.defaultPrevented) {
            return;
        }
        new EditContentEvent([content]).fire();
    };

    return (
        <ListItem
            selected={selected}
            data-component={componentName}
            className={cn(
                'pl-0 py-0',
                statusBelowLabelBelowSm && 'max-sm:grid max-sm:grid-cols-1 max-sm:gap-0',
                className,
            )}
            {...props}
        >
            <ListItem.Content className="flex">
                <Button
                    ref={contentButtonRef}
                    onClick={handleClick}
                    className={cn(
                        'box-content justify-start flex-1 px-2.5 py-1',
                        'active:bg-transparent data-[active=true]:bg-transparent data-[active=true]:text-unset',
                        isCompact && 'h-6',
                        contentButtonClassName,
                    )}
                    {...restContentButtonProps}
                >
                    <ContentLabel content={content} variant={variant} />
                </Button>
            </ListItem.Content>
            <ListItem.Right
                className={cn(
                    'self-stretch',
                    statusBelowLabelBelowSm &&
                        'max-sm:ml-11 max-sm:min-w-0 max-sm:gap-2.5 max-sm:justify-start max-sm:self-auto max-sm:pr-2.5 max-sm:pb-1',
                )}
            >
                {rightSlotOrder === 'before-status' && children && (
                    <div className={cn('contents', rightSlotAfterStatusBelowSm && 'max-sm:order-2 max-sm:flex')}>
                        {children}
                    </div>
                )}
                <div className={cn('contents', rightSlotAfterStatusBelowSm && 'max-sm:order-1 max-sm:flex')}>
                    <DiffStatusBadge contentSummary={content} />
                </div>
                {rightSlotOrder === 'after-status' && children && <div className="contents">{children}</div>}
            </ListItem.Right>
        </ListItem>
    );
};

ContentListItem.displayName = CONTENT_LIST_ITEM_NAME;

export class ContentListItemElement extends LegacyElement<typeof ContentListItem, ContentItemProps> {
    constructor(props: ContentItemProps) {
        super({ ...props }, ContentListItem);
    }

    getItem(): ContentSummary {
        return this.props.get().content;
    }

    isSelected(): boolean {
        return this.props.get().selected === true;
    }

    isSelectable(): boolean {
        return true;
    }

    setSelected(selected: boolean): void {
        this.props.setKey('selected', selected);
    }

    onSelected(): void {
        // Backward compatibility
    }
}
