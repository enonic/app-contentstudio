import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {IconButton, Tooltip} from '@enonic/ui';
import {SquareArrowOutUpRight} from 'lucide-react';
import {ReactElement} from 'react';

export const PreviewToolbarOpenExternalButton = ({action}: {action: Action}): ReactElement => {
    const tooltipValue = `${action.getLabel()} (${formatShortcut(action)})`;

    return (
        <Tooltip value={tooltipValue} side="bottom">
            <IconButton
                size="sm"
                className="flex-shrink-0"
                icon={SquareArrowOutUpRight}
                onClick={() => action?.execute()}
                aria-label={tooltipValue}
            />
        </Tooltip>
    );
};

//
// * Utilities
//
function formatShortcut(action: Action): string {
    const isApple = BrowserHelper.isOSX() || BrowserHelper.isIOS();

    return (
        action
            .getShortcut()
            .getCombination()
            ?.replace(/mod\+/i, isApple ? 'cmd+' : 'ctrl+') ?? ''
    );
}

PreviewToolbarOpenExternalButton.displayName = 'PreviewToolbarOpenExternalButton';
