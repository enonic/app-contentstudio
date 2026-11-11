import { IdProvider } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import type { ReactElement } from 'react';
import { render } from 'react-dom';
import { initFormTypes } from '../features/shared/form/input-types';
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
import { start as startProjectDialogService } from '../features/manage-project/model/projectDialog.service';
import { start as startPublishDialogService } from '../features/publish/model/publishDialog.service';
import { start as startRequestPublishDialogService } from '../features/request-publish/model/requestPublishDialog.service';
import { start as startSortDialogService } from '../features/sort/model/sortDialog.service';
import { start as startUnpublishDialogService } from '../features/unpublish/model/unpublishDialog.service';
import { start as startContextContentService } from '../widgets/context-panel/model/contextContent.service';
import { start as startContextWidgetsService } from '../widgets/context-panel/model/contextWidgets.service';
import { start as startPreviewPanelService } from '../widgets/preview-panel/model/previewPanel.service';
import { setActiveProjectResolver } from '../shared/lib/url/cms';
import { $isWizard } from '../shared/app-state/app.store';
import { $projects } from '../entities/project';
import { BrowsePage } from '../pages/browse/BrowsePage';
import { WizardPage } from '../pages/wizard/ui/WizardPage';

const APP_NAME = 'App';

/**
 * The application root. The browse page owns the whole browse layout; the
 * wizard page still renders only dialogs next to the legacy wizard panel.
 */
const App = (): ReactElement => {
    const isWizard = useStore($isWizard);

    return isWizard ? <WizardPage /> : <BrowsePage />;
};

App.displayName = APP_NAME;

let host: HTMLElement | undefined;

/**
 * Starts the app-wide services and renders the application root into the body.
 * Called once from the application bootstrap; later calls are no-ops.
 */
export function mountApp(): void {
    if (host) {
        return;
    }

    initFormTypes();
    setActiveProjectResolver(() => $projects.get().activeProjectId);
    startSocketService();
    startContentService();
    startProjectSwitchService();
    startKeyBindingsGuard();
    startActionsService();
    startContextContentService();
    startContextWidgetsService();
    startPreviewPanelService();
    startDeleteDialogService();
    startDuplicateDialogService();
    startIssueDialogService();
    startIssueDialogDetailsService();
    startNewIssueDialogService();
    startProjectDialogService();
    startPublishDialogService();
    startRequestPublishDialogService();
    startSortDialogService();
    startUnpublishDialogService();

    host = document.createElement('div');
    host.dataset.component = APP_NAME;
    host.className = 'contents';
    document.body.appendChild(host);

    render(
        <IdProvider prefix={APP_NAME}>
            <App />
        </IdProvider>,
        host,
    );
}
