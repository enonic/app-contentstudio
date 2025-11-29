import {ReactElement} from 'react';
import {WidgetView} from '../../../../app/view/context/WidgetView';
import {cn} from '@enonic/ui';

export function WidgetIcon({
    widgetView,
    size = 'md',
}: {
    widgetView: WidgetView;
    size?: 'sm' | 'md' | 'lg';
}): ReactElement {
    if (!widgetView) return undefined;

    let sizeNumber = 6;
    let className = 'size-6';

    if (size === 'sm') {
        sizeNumber = 4;
        className = 'size-4';
    }

    if (size === 'lg') {
        sizeNumber = 8;
        className = 'size-8';
    }

    if (widgetView.getWidgetIconUrl()) {
        return (
            <img
                src={widgetView.getWidgetIconUrl()}
                alt={widgetView.getWidgetName()}
                className={cn('size-6 dark:invert-100', className)}
            />
        );
    }

    if (widgetView.getWidgetIcon()) {
        const Icon = widgetView.getWidgetIcon();

        return <Icon size={sizeNumber} className={cn(className)} />;
    }

    if (widgetView.getWidgetIconClass()) {
        return <span className={cn(widgetView.getWidgetIconClass(), 'dark:before:invert-100', className)} />;
    }

    return undefined;
}
