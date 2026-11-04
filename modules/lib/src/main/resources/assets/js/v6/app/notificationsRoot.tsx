import { I18nProvider } from '@enonic/ui';
import { NotificationList } from '@enonic/ui-kit';
import { render } from 'react-dom';
import { translate } from '../shared/i18n';
import { notifications } from '../shared/notifications';

// Same corner as the legacy `.notification-container`, one above its `z-index: 2004`,
// so a v6 toast is never covered while the two stacks share the screen.
const NOTIFICATIONS_POSITION =
    'pointer-events-none fixed right-0 bottom-0 z-[2005] w-full px-2 pb-2 ' +
    'sm:right-9 sm:bottom-6 sm:max-w-115 sm:p-0 ' +
    'md:right-11.5 md:bottom-7.5 lg:right-15 lg:bottom-10 2xl:right-23 2xl:bottom-15';

let host: HTMLElement | undefined;

/**
 * Renders the v6 toast stack in its own root on `body`. Called once by every entry
 * that bootstraps v6; a second call is a no-op.
 */
export function mountNotifications(): void {
    if (host != null) {
        return;
    }

    host = document.createElement('div');
    document.body.appendChild(host);

    render(
        <I18nProvider translate={translate}>
            <NotificationList notifications={notifications} className={NOTIFICATIONS_POSITION} />
        </I18nProvider>,
        host,
    );
}
