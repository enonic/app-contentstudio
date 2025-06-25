import {cn} from '@enonic/ui';
import type {ReactElement} from 'react';
import type {ExtensionView} from '../../../../app/view/context/ExtensionView';

type WidgetIconProps = {
    widgetView: ExtensionView;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
};

const SIZE_MAP = {
    sm: {className: 'size-4', number: 4},
    md: {className: 'size-6', number: 6},
    lg: {className: 'size-8', number: 8},
} as const;

export function WidgetIcon({widgetView, size = 'md', className}: WidgetIconProps): ReactElement {
    if (!widgetView) return null;

    const {className: sizeClass, number: sizeNumber} = SIZE_MAP[size];

    if (widgetView.getExtensionIconUrl()) {
        return (
            <img
                src={widgetView.getExtensionIconUrl()}
                alt={widgetView.getExtensionName()}
                className={cn(sizeClass, 'dark:invert-100', className)}
            />
        );
    }

    if (widgetView.getExtensionIcon()) {
        const Icon = widgetView.getExtensionIcon();

        return <Icon size={sizeNumber} className={cn(sizeClass, className)} />;
    }

    if (widgetView.getExtensionIconClass()) {
        return <span className={cn(widgetView.getExtensionIconClass(), sizeClass, 'dark:before:invert-100', className)} />;
    }

    return null;
}

WidgetIcon.displayName = 'WidgetIcon';
