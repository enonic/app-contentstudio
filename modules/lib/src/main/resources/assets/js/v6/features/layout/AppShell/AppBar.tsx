import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Button, IconButton} from '@enonic/ui';
import {ArrowLeftRight, BellIcon, LayoutGrid} from 'lucide-react';
import {ReactElement} from 'react';
import {ProjectSelectionDialog} from '../../../../app/dialog/ProjectSelectionDialog';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {ShowIssuesDialogEvent} from '../../../../app/browse/ShowIssuesDialogEvent';
import {useI18n} from '../../../../app/ui2/hooks/useI18n';

const AppBar = (): ReactElement => {
    return (
        <header className="bg-surface-neutral h-15 px-5 py-2 flex items-center gap-2.5 border-b border-bdr-soft">
            <Button
                className="mr-auto"
                size="sm"
                endIcon={ArrowLeftRight}
                onClick={() => {
                    ProjectSelectionDialog.get().open();
                }}
                aria-label={useI18n('wcag.appbar.project.label')}
            >
                Default Project
            </Button>

            <Button
                className="max-sm:hidden"
                size="sm"
                startIcon={BellIcon}
                onClick={() => {
                    new ShowIssuesDialogEvent().fire();
                }}
                aria-label={useI18n('wcag.appbar.issues.label')}
            >
                Issues
            </Button>

            <IconButton
                size="sm"
                icon={LayoutGrid}
                shape="round"
                onClick={() => {
                    // TODO: Enonic UI Hack
                    // Defer the click to the next event loop to prevent the launcher from closing due to its outside-click handler
                    requestAnimationFrame(() => document.getElementById('launcher-button')?.click());
                }}
                aria-label={useI18n('wcag.appbar.launcher.label')}
            />
        </header>
    );
};

export class AppBarElement extends LegacyElement<typeof AppBar> {
    constructor() {
        super({}, AppBar);
    }

    // Backwards compatibility - will be removed after implementing the proper stores for projects & issues

    static getInstance(): AppBarElement {
        let instance: AppBarElement = Store.instance().get(AppBarElement.name);

        if (instance == null) {
            instance = new AppBarElement();
            Store.instance().set(AppBarElement.name, instance);
        }

        return instance;
    }

    setAppName(name: string) {}

    disable() {}

    showIssuesButton() {}

    hideIssuesButton() {}

    showProjectSelector() {}

    hideProjectSelector() {}
}
