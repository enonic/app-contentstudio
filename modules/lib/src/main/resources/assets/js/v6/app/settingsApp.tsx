import { IdProvider } from '@enonic/ui';
import { render } from 'react-dom';
import { $projects } from '../entities/project';
import { start as startProjectDialogService } from '../features/manage-project/model/projectDialog.service';
import { initFormTypes } from '../features/shared/form/input-types';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { setActiveProjectResolver } from '../shared/lib/url/cms';

/**
 * Renders the settings page as the single React root of the settings widget.
 * Called from the widget bootstrap once config, auth and the stores are
 * initialized.
 */
export function mountSettingsApp(host: HTMLElement): void {
    initFormTypes();
    setActiveProjectResolver(() => $projects.get().activeProjectId);
    startProjectDialogService();

    render(
        <IdProvider prefix="SettingsPage">
            <SettingsPage />
        </IdProvider>,
        host,
    );
}
