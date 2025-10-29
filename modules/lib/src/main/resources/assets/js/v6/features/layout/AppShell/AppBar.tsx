import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Button, IconButton} from '@enonic/ui';
import {ArrowLeftRight, BellIcon, LayoutGrid} from 'lucide-react';
import {ReactElement} from 'react';
import {ProjectSelectionDialog} from '../../../../app/dialog/ProjectSelectionDialog';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {ShowIssuesDialogEvent} from '../../../../app/browse/ShowIssuesDialogEvent';
import {useI18n} from '../../../../app/ui2/hooks/useI18n';

const AppBar = (): ReactElement => {
    const projectClickHandler = () => {
        ProjectSelectionDialog.get().open();
    };

    const issuesClickHandler = () => {
        new ShowIssuesDialogEvent().fire();
    };

    const launcherClickHandler = () => {
        const launcherButton = document.getElementById('launcher-button');

        // TODO: Enonic UI Hack
        // Defer the click to the next event loop to prevent the launcher from closing due to its outside-click handler
        setTimeout(() => launcherButton?.click());
    };

    return (
        <nav className="dark:bg-surface-neutral h-[60px] px-5 py-3 flex items-center justify-between border-b border-bdr-soft">
            <Button
                size="sm"
                className="flex gap-2.75 items-center text-sm font-semibold"
                onClick={projectClickHandler}
                aria-label={useI18n('wcag.appbar.project.label')}
            >
                Default Project
                <ArrowLeftRight size={14} />
            </Button>

            <div class="flex gap-1.25 items-center">
                <Button
                    size="sm"
                    className="gap-2.75 text-sm font-semibold hidden md:flex md:items-center"
                    onClick={issuesClickHandler}
                    aria-label={useI18n('wcag.appbar.issues.label')}
                >
                    <BellIcon size={14} />
                    Issues
                </Button>
                <IconButton
                    size="sm"
                    icon={LayoutGrid}
                    iconSize={14}
                    shape="round"
                    onClick={launcherClickHandler}
                    aria-label={useI18n('wcag.appbar.launcher.label')}
                />
            </div>
        </nav>
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
