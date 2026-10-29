import { cn } from '@enonic/ui';
import type { ReactElement } from 'react';
import type { ContextWidget } from '../model/contextWidget.types';

export type WidgetIconProps = {
    widget: ContextWidget;
    size?: 'sm' | 'md' | 'lg';
    strokeWidth?: number;
    className?: string;
};

const SIZE_MAP = {
    sm: { className: 'size-4', number: 4 },
    md: { className: 'size-6', number: 6 },
    lg: { className: 'size-8', number: 8 },
} as const;

export function WidgetIcon({ widget, size = 'md', strokeWidth, className }: WidgetIconProps): ReactElement | null {
    const { className: sizeClass, number: sizeNumber } = SIZE_MAP[size];

    if (widget.iconUrl) {
        return <img src={widget.iconUrl} alt={widget.title} className={cn(sizeClass, 'dark:invert-100', className)} />;
    }

    const Icon = widget.icon;
    if (Icon == null) return null;

    return <Icon size={sizeNumber} strokeWidth={strokeWidth} className={cn(sizeClass, className)} />;
}
