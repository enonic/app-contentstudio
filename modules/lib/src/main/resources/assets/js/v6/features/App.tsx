import { Body } from '@enonic/lib-admin-ui/dom/Body';
import { useStore } from '@nanostores/preact';
import type { ReactElement } from 'react';
import { start as startKeyBindingsGuard } from './services/keyBindingsGuard.service';
import { startSocketService } from '../shared/socket';
import { startContentService } from '../entities/content';
import { setActiveProjectResolver } from '../shared/lib/url/cms';
import { LegacyElement } from '../shared/ui/LegacyElement';
import { $isWizard } from './store/app.store';
import { $projects } from './store/projects.store';
import { BrowsePage } from './views/browse/BrowsePage';
import { WizardPage } from './views/wizard/WizardPage';

/**
 * AppShell component that renders the whole application layout.
 * This component is rendered at the app root level to ensure dialogs
 * are portaled correctly and don't interfere with app layout.
 */
const App = (): ReactElement => {
    const isWizard = useStore($isWizard);

    return isWizard ? <WizardPage /> : <BrowsePage />;
};

App.displayName = 'App';

export class AppElement extends LegacyElement<typeof App> {
    private static INSTANCE: AppElement;

    private constructor() {
        super({}, App);
    }

    static initialize(): void {
        if (!AppElement.INSTANCE) {
            setActiveProjectResolver(() => $projects.get().activeProjectId);
            startSocketService();
            startContentService();
            startKeyBindingsGuard();
            AppElement.INSTANCE = new AppElement();
            Body.get().appendChild(AppElement.INSTANCE);
        }
    }
}
