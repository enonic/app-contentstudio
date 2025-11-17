import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';

export function formatShortcut(action: Action): string {
    const isApple = BrowserHelper.isOSX() || BrowserHelper.isIOS();

    return (
        action
            .getShortcut()
            .getCombination()
            ?.replace(/mod\+/i, isApple ? 'cmd+' : 'ctrl+') ?? ''
    );
}
