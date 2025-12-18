import {Body} from '@enonic/lib-admin-ui/dom/Body';
import type {ReactElement} from 'react';
import {ContentAppHelper} from '../../app/wizard/ContentAppHelper';
import {WizardPage} from './views/wizard/WizardPage';
import {BrowsePage} from './views/browse/BrowsePage';
import {LegacyElement} from './shared/LegacyElement';
import {start as startSocketService} from './services/socket.service';

/**
 * AppShell component that renders the whole application layout.
 * Right now it only renders global dialogs and modals.
 * This component is rendered at the app root level to ensure dialogs
 * are portaled correctly and don't interfere with app layout.
 */
const App = (): ReactElement => {

    const isWizard = ContentAppHelper.isContentWizardUrl();

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
            AppElement.INSTANCE = new AppElement();
            Body.get().appendChild(AppElement.INSTANCE);
        }
    }
}
