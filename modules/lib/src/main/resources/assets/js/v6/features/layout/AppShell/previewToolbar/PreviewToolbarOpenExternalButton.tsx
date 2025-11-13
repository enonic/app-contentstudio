import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {IconButton, Tooltip} from '@enonic/ui';
import {SquareArrowOutUpRight} from 'lucide-react';
import {ReactElement, useEffect, useState} from 'react';

export const PreviewToolbarOpenExternalButton = ({action}: {action: Action}): ReactElement => {
    const tooltipValue = `${action.getLabel()} (${formatShortcut(action)})`;
    const [isEnabled, setIsEnabled] = useState(action.isEnabled());

    useEffect(() => {
        if (!action) return;

        setIsEnabled(action.isEnabled());

        const handlePropertyChanged = () => {
            setIsEnabled(action.isEnabled());
        };

        action.onPropertyChanged(handlePropertyChanged);

        return () => {
            action.unPropertyChanged(handlePropertyChanged);
        };
    }, [action]);

    return (
        <Tooltip value={tooltipValue} side="bottom">
            <IconButton
                size="sm"
                className="flex-shrink-0"
                icon={SquareArrowOutUpRight}
                onClick={() => action?.execute()}
                aria-label={tooltipValue}
                disabled={!isEnabled}
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
