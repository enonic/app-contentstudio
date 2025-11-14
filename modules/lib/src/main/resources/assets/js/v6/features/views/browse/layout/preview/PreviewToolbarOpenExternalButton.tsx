import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {IconButton, Tooltip, Toolbar} from '@enonic/ui';
import {SquareArrowOutUpRight} from 'lucide-react';
import {ReactElement} from 'react';
import {formatShortcut} from '../../../../utils/action';
import {$isWidgetRenderable} from '../../../../store/isWidgetRenderable';
import {useStore} from '@nanostores/preact';

export const PreviewToolbarOpenExternalButton = ({action}: {action: Action}): ReactElement => {
    const label = action.getLabel();
    const shortcut = formatShortcut(action);
    const isWidgetRenderable = useStore($isWidgetRenderable);

    return (
        <Tooltip
            value={
                <div className="mr-7.5">
                    <span className="text-nowrap block">{label}</span>(<kbd>{shortcut}</kbd>)
                </div>
            }
        >
            <Toolbar.Item asChild disabled={!isWidgetRenderable}>
                <IconButton
                    size="sm"
                    className="flex-shrink-0"
                    icon={SquareArrowOutUpRight}
                    onClick={() => action?.execute()}
                    aria-label={`${label} (${shortcut})`}
                    disabled={!isWidgetRenderable}
                />
            </Toolbar.Item>
        </Tooltip>
    );
};

PreviewToolbarOpenExternalButton.displayName = 'PreviewToolbarOpenExternalButton';
