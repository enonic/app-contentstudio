import { Body } from '@enonic/lib-admin-ui/dom/Body';
import { initBuiltInTypes } from '@enonic/lib-admin-ui/form2';
import { registerContentStudioInputTypes } from '../features/shared/form/input-types';
import { useStore } from '@nanostores/preact';
import type { ReactElement } from 'react';
import { start as startActionsService } from './actions.service';
import { start as startKeyBindingsGuard } from './keyBindingsGuard.service';
import { start as startProjectSwitchService } from './projectSwitch.service';
import { startSocketService } from '../shared/socket';
import { startContentService } from '../entities/content';
import { start as startDeleteDialogService } from '../features/delete/model/deleteDialog.service';
import { start as startDuplicateDialogService } from '../features/duplicate/model/duplicateDialog.service';
import { start as startIssueDialogService } from '../features/issues/model/issueDialog.service';
import { start as startIssueDialogDetailsService } from '../features/issues/model/issueDialogDetails.service';
import { start as startNewIssueDialogService } from '../features/issues/model/newIssueDialog.service';
import { start as startPublishDialogService } from '../features/publish/model/publishDialog.service';
import { start as startRequestPublishDialogService } from '../features/request-publish/model/requestPublishDialog.service';
import { start as startSortDialogService } from '../features/sort/model/sortDialog.service';
import { start as startUnpublishDialogService } from '../features/unpublish/model/unpublishDialog.service';
import { start as startContextContentService } from '../widgets/context-panel/model/contextContent.service';
import { setActiveProjectResolver } from '../shared/lib/url/cms';
import { LegacyElement } from '../shared/ui/LegacyElement';
import { $isWizard } from '../shared/app-state/app.store';
import { $projects } from '../entities/project';
import { BrowsePage } from '../pages/browse/BrowsePage';
import { WizardPage } from '../pages/wizard/ui/WizardPage';

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
            initBuiltInTypes();
            registerContentStudioInputTypes();
            setActiveProjectResolver(() => $projects.get().activeProjectId);
            startSocketService();
            startContentService();
            startProjectSwitchService();
            startKeyBindingsGuard();
            startActionsService();
            startContextContentService();
            startDeleteDialogService();
            startDuplicateDialogService();
            startIssueDialogService();
            startIssueDialogDetailsService();
            startNewIssueDialogService();
            startPublishDialogService();
            startRequestPublishDialogService();
            startSortDialogService();
            startUnpublishDialogService();
            AppElement.INSTANCE = new AppElement();
            Body.get().appendChild(AppElement.INSTANCE);
        }
    }
}
