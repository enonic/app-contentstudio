import type {ReactNode} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';

export type ContentRowProps = {
    content: ContentSummaryAndCompareStatus;
    id: string;
    disabled?: boolean;
    className?: string;
    children: ReactNode;
};

export type ContentRowContextValue = {
    content: ContentSummaryAndCompareStatus;
    disabled: boolean;
};

export type ContentRowCheckboxProps = {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
};

export type ContentRowLabelProps = {
    action?: 'edit' | 'none';
    variant?: 'default' | 'compact';
    className?: string;
};

export type ContentRowStatusProps = {
    variant?: 'diff' | 'simple' | 'none';
    className?: string;
};

export type ContentRowCellProps = {
    children: ReactNode;
    interactive?: boolean;
    className?: string;
};

export type ContentRowRemoveButtonProps = {
    onRemove: () => void;
    disabled?: boolean;
    title?: string;
    className?: string;
};
