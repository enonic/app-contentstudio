import {cn, IconButton, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Layers} from 'lucide-react';
import {type MouseEvent, type ReactElement} from 'react';
import {useI18n} from '../../hooks/useI18n';
import {$registeredWidgetNames} from '../../store/contextWidgets.store';
import {LAYERS_WIDGET_NAME} from '../../utils/widget/layers';

export type LayerIndicatorProps = {
    isLocalised: boolean;
    onClick: (e: MouseEvent<HTMLButtonElement>) => void;
    onDblClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    tabIndex?: number;
    className?: string;
};

export const LayerIndicator = ({
    isLocalised,
    onClick,
    onDblClick,
    tabIndex,
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
                size='sm'
                icon={Layers}
                aria-label={tooltip}
                aria-disabled={!isClickable}
                onClick={isClickable ? onClick : undefined}
                onDblClick={onDblClick}
                tabIndex={tabIndex}
                className={cn(
                    'shrink-0 bg-transparent hover:bg-transparent',
                    !isLocalised && 'opacity-40',
                    !isClickable && [
                        'cursor-default',
                        'active:bg-transparent active:text-main',
                        'focus-visible:ring-0 focus-visible:ring-offset-0',
                    ],
                    className,
                )}
            />
        </Tooltip>
    );
};

LayerIndicator.displayName = 'LayerIndicator';
