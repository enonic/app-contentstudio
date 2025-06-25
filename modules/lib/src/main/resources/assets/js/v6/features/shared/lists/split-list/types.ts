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

export type SplitListSeparatorToggleProps = {
    label: string;
    pressed: boolean;
    onPressedChange: (pressed: boolean) => void;
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
};
