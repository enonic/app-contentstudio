import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {IconButton, Tooltip, Toolbar} from '@enonic/ui';
import {SquareArrowOutUpRight} from 'lucide-react';
import {ReactElement} from 'react';
import {formatShortcut} from '../../../../utils/format/shortcuts';
import {$isWidgetRenderable} from '../../../../store/contextWidgets.store';
import {useStore} from '@nanostores/preact';

export const PreviewToolbarOpenExternalItem = ({action}: {action: Action}): ReactElement => {
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
                />
            </Toolbar.Item>
        </Tooltip>
    );
};

PreviewToolbarOpenExternalItem.displayName = 'PreviewToolbarOpenExternalItem';
