import { cn, IconButton, Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Layers } from 'lucide-react';
import { type MouseEvent, type ReactElement } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { $registeredWidgetNames } from '../../../widgets/context-panel/model/contextWidgets.store';
import { LAYERS_WIDGET_NAME } from '../../../shared/lib/widget/layers';

export type LayerIndicatorProps = {
    isLocalised: boolean;
    onClick: (e: MouseEvent<HTMLButtonElement>) => void;
    onDblClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    tabIndex?: number;
    selected?: boolean;
    className?: string;
};

export const LayerIndicator = ({
    isLocalised,
    onClick,
    onDblClick,
    tabIndex,
    selected = false,
    className,
}: LayerIndicatorProps): ReactElement => {
    const registeredWidgetNames = useStore($registeredWidgetNames);
    const isClickable = registeredWidgetNames.has(LAYERS_WIDGET_NAME);

    const localisedLabel = useI18n('widget.layers.localised');
    const notLocalisedLabel = useI18n('widget.layers.notLocalised');
    const tooltip = isLocalised ? localisedLabel : notLocalisedLabel;

    return (
        <Tooltip delay={300} value={tooltip}>
            <IconButton
                size="sm"
                icon={Layers}
                aria-label={tooltip}
                aria-disabled={!isClickable}
                onClick={isClickable ? onClick : undefined}
                onDblClick={onDblClick}
                tabIndex={tabIndex}
                className={cn(
                    'shrink-0 bg-transparent hover:bg-transparent active:bg-transparent active:text-main',
                    selected && 'text-alt hover:text-alt active:text-alt',
                    !isLocalised && 'opacity-40',
                    !isClickable && ['cursor-default', 'focus-visible:ring-0 focus-visible:ring-offset-0'],
                    className,
                )}
            />
        </Tooltip>
    );
};

LayerIndicator.displayName = 'LayerIndicator';
