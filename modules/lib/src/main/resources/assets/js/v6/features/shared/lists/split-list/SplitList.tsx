import {cn, GridList, Separator, Toggle} from '@enonic/ui';
import type {ReactElement, ReactNode} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import type {
    SplitListPrimaryProps,
    SplitListProps,
    SplitListSecondaryProps,
    SplitListSeparatorLabelProps,
    SplitListSeparatorProps,
    SplitListSeparatorToggleProps,
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
// * SplitList.SeparatorToggle
//

const SPLIT_LIST_SEPARATOR_TOGGLE_NAME = 'SplitList.SeparatorToggle';

const SplitListSeparatorToggle = ({
    label,
    pressed,
    onPressedChange,
    disabled = false,
    className,
}: SplitListSeparatorToggleProps): ReactElement => {
    return (
        <Toggle
            size='sm'
            label={label}
            pressed={pressed}
            onPressedChange={onPressedChange}
            disabled={disabled}
            className={className}
        />
    );
};

SplitListSeparatorToggle.displayName = SPLIT_LIST_SEPARATOR_TOGGLE_NAME;

//
// * SplitList.Secondary
//

const SPLIT_LIST_SECONDARY_NAME = 'SplitList.Secondary';

function SplitListSecondary<T>({
    items,
    renderRow,
    emptyMessage,
    className,
    disabled = false,
}: SplitListSecondaryProps<T>): ReactElement | null {
    const secondaryLabel = useI18n('field.split.secondary');

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
        <GridList
            data-component={SPLIT_LIST_SECONDARY_NAME}
            className={cn('flex flex-col gap-y-1.5 py-2 rounded-md', className)}
            label={secondaryLabel}
            disabled={disabled}
        >
            {items.map((item, index) => renderRow(item, index))}
        </GridList>
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
    SeparatorToggle: SplitListSeparatorToggle,
    Secondary: SplitListSecondary,
});
