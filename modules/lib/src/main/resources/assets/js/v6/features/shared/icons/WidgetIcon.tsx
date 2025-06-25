import {ReactElement} from 'react';
import {WidgetView} from '../../../../app/view/context/WidgetView';
import {cn} from '@enonic/ui';

type WidgetIconProps = {
    widgetView: WidgetView;
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

    if (widgetView.getWidgetIconUrl()) {
        return (
            <img
                src={widgetView.getWidgetIconUrl()}
                alt={widgetView.getWidgetName()}
                className={cn(sizeClass, 'dark:invert-100', className)}
            />
        );
    }

    if (widgetView.getWidgetIcon()) {
        const Icon = widgetView.getWidgetIcon();

        return <Icon size={sizeNumber} className={cn(sizeClass, className)} />;
    }

    if (widgetView.getWidgetIconClass()) {
        return <span className={cn(widgetView.getWidgetIconClass(), sizeClass, 'dark:before:invert-100', className)} />;
    }

    return null;
}

WidgetIcon.displayName = 'WidgetIcon';
