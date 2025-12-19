import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {useStore} from '@nanostores/preact';
import type {ReactElement} from 'react';
import {WizardPage} from './views/wizard/WizardPage';
import {BrowsePage} from './views/browse/BrowsePage';
import {LegacyElement} from './shared/LegacyElement';
import {start as startSocketService} from './services/socket.service';
import {$isWizard, setPage} from './store/app.store';
import {getAppPageFromLocation} from './utils/url/app';

/**
 * AppShell component that renders the whole application layout.
 * Right now it only renders global dialogs and modals.
 * This component is rendered at the app root level to ensure dialogs
 * are portaled correctly and don't interfere with app layout.
 */
const App = (): ReactElement => {

    const isWizard = useStore($isWizard);

    return (
        <>
            {isWizard ? <WizardPage /> : <BrowsePage />}
        </>
    );
};

App.displayName = 'App';

export class AppElement extends LegacyElement<typeof App> {
    private static INSTANCE: AppElement;

    private constructor() {
        super({}, App);
    }

    static initialize(): void {
        if (!AppElement.INSTANCE) {
            startSocketService();
            setPage(getAppPageFromLocation());
            AppElement.INSTANCE = new AppElement();
            Body.get().appendChild(AppElement.INSTANCE);
        }
    }
}
