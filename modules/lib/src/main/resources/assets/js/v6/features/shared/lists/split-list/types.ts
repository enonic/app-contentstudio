import type {ReactNode} from 'react';

//
// * SplitList Props
//

export type SplitListProps = {
    className?: string;
    children: ReactNode;
};

export type SplitListPrimaryProps<T> = {
    items: T[];
    getItemId: (item: T) => string;
    renderRow: (item: T, index: number) => ReactNode;
    className?: string;
    disabled?: boolean;
};

export type SplitListSeparatorProps = {
    children: ReactNode;
    hidden?: boolean;
    className?: string;
};

export type SplitListSeparatorLabelProps = {
    children: ReactNode;
    className?: string;
};

export type SplitListSeparatorButtonProps = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
};

export type SplitListSecondaryProps<T> = {
    items: T[];
    getItemId: (item: T) => string;
    renderRow: (item: T, index: number) => ReactNode;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
    /** When true, a load is in progress; suspends the end-reached trigger. */
    loading?: boolean;
    /** When true, more items can be lazy-loaded as the user scrolls to the end. */
    hasMore?: boolean;
    /** Invoked when the end of the list is scrolled into view (lazy-load trigger). */
    onEndReached?: () => void;
};
