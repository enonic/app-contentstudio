import {cn, GridList, Separator} from '@enonic/ui';
import type {ReactElement, ReactNode} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {useInfiniteScroll} from '../../../hooks/useInfiniteScroll';
import {InlineButton} from '../../InlineButton';
import type {
    SplitListPrimaryProps,
    SplitListProps,
    SplitListSecondaryProps,
    SplitListSeparatorButtonProps,
    SplitListSeparatorLabelProps,
    SplitListSeparatorProps,
} from './types';

//
// * SplitList (Container)
//

const SPLIT_LIST_NAME = 'SplitList';

const SplitListRoot = ({
    className,
    children,
}: SplitListProps): ReactElement => {
    return (
        <div className={cn('flex flex-col gap-y-8', className)} tabIndex={-1}>
            {children}
        </div>
    );
};

SplitListRoot.displayName = SPLIT_LIST_NAME;

//
// * SplitList.Primary
//

const SPLIT_LIST_PRIMARY_NAME = 'SplitList.Primary';

function SplitListPrimary<T>({
    items,
    getItemId,
    renderRow,
    className,
    disabled = false,
}: SplitListPrimaryProps<T>): ReactElement {
    const contentItemsLabel = useI18n('field.split.primary');

    return (
        <GridList
            data-component={SPLIT_LIST_PRIMARY_NAME}
            className={cn('flex flex-col gap-y-2.5 py-2 rounded-md', className)}
            label={contentItemsLabel}
            disabled={disabled}
        >
            {items.map((item, index) => renderRow(item, index))}
        </GridList>
    );
}

SplitListPrimary.displayName = SPLIT_LIST_PRIMARY_NAME;

//
// * SplitList.Separator
//

const SPLIT_LIST_SEPARATOR_NAME = 'SplitList.Separator';

const SplitListSeparator = ({
    children,
    hidden = false,
    className,
}: SplitListSeparatorProps): ReactElement | null => {
    if (hidden) {
        return null;
    }

    return (
        <div className={cn('flex items-center gap-2.5 -mt-2.5 -mb-7.5 pr-1', className)}>
            {children}
        </div>
    );
};

SplitListSeparator.displayName = SPLIT_LIST_SEPARATOR_NAME;

//
// * SplitList.SeparatorLabel
//

const SPLIT_LIST_SEPARATOR_LABEL_NAME = 'SplitList.SeparatorLabel';

const SplitListSeparatorLabel = ({
    children,
    className,
}: SplitListSeparatorLabelProps): ReactElement => {
    return (
        <Separator className={cn('text-sm flex-1', className)} label={typeof children === 'string' ? children : undefined} />
    );
};

SplitListSeparatorLabel.displayName = SPLIT_LIST_SEPARATOR_LABEL_NAME;

//
// * SplitList.SeparatorButton
//

const SPLIT_LIST_SEPARATOR_BUTTON_NAME = 'SplitList.SeparatorButton';

const SplitListSeparatorButton = ({
    label,
    onClick,
    disabled = false,
    className,
}: SplitListSeparatorButtonProps): ReactElement => {
    return (
        <InlineButton
            label={label}
            onClick={onClick}
            disabled={disabled}
            className={className}
        />
    );
};

SplitListSeparatorButton.displayName = SPLIT_LIST_SEPARATOR_BUTTON_NAME;

//
// * SplitList.Secondary
//

const SPLIT_LIST_SECONDARY_NAME = 'SplitList.Secondary';

const NOOP = (): void => undefined;

function SplitListSecondary<T>({
    items,
    renderRow,
    emptyMessage,
    className,
    disabled = false,
    loading = false,
    hasMore = false,
    onEndReached,
}: SplitListSecondaryProps<T>): ReactElement | null {
    const secondaryLabel = useI18n('field.split.secondary');

    // IntersectionObserver clips against the scrolling Dialog.Body anyway, so the
    // hook's default viewport root is correct here. Lazy-loading is gated by
    // `loading` only: a disabled (read-only) list must still load on scroll.
    const sentinelRef = useInfiniteScroll<HTMLDivElement>({
        hasMore,
        isLoading: loading,
        onLoadMore: onEndReached ?? NOOP,
    });

    if (items.length === 0) {
        if (!emptyMessage) {
            return null;
        }
        return (
            <div data-component={SPLIT_LIST_SECONDARY_NAME} className={cn('text-sm text-subtle italic', className)}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <>
            <GridList
                data-component={SPLIT_LIST_SECONDARY_NAME}
                className={cn('flex flex-col gap-y-1.5 py-2 rounded-md', className)}
                label={secondaryLabel}
                disabled={disabled}
            >
                {items.map((item, index) => renderRow(item, index))}
            </GridList>
            {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
        </>
    );
}

SplitListSecondary.displayName = SPLIT_LIST_SECONDARY_NAME;

//
// * SplitList Export
//

export const SplitList = Object.assign(SplitListRoot, {
    Primary: SplitListPrimary,
    Separator: SplitListSeparator,
    SeparatorLabel: SplitListSeparatorLabel,
    SeparatorButton: SplitListSeparatorButton,
    Secondary: SplitListSecondary,
});
