import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {Button, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ArrowLeftRight, BellDotIcon, BellIcon, LayoutGrid} from 'lucide-react';
import {ReactElement} from 'react';
import {ShowIssuesDialogEvent} from '../../../../app/browse/ShowIssuesDialogEvent';
import {useI18n} from '../../../../app/ui2/hooks/useI18n';
import {$activeProjectName} from '../../store/projects.store';
import {setProjectSelectionDialogOpen} from '../../store/dialogs.store';
import {$issuesStats} from '../../store/issuesStats.store';
import {IssueStatsJson} from '../../../../app/issue/json/IssueStatsJson';

function createIssuesLabelKeys(stats: Readonly<IssueStatsJson> | undefined): [`field.${string}`, ...string[]] {
    if (stats?.openAssignedToMe > 0) {
        return ['field.assignedToMeCount', String(stats.openAssignedToMe)];
    }

    if (stats?.open > 0) {
        return ['field.openIssuesCount', String(stats.open)];
    }

    return ['field.noOpenIssues'];
}

const AppBar = (): ReactElement => {
    const activeProjectName = useStore($activeProjectName);
    const {stats} = useStore($issuesStats);
    const issuesStatsLabel = useI18n(...createIssuesLabelKeys(stats));

    return (
        <header className="bg-surface-neutral h-15 px-5 py-2 flex items-center gap-2.5 border-b border-bdr-soft">
            <Button
                className="mr-auto"
                size="sm"
                endIcon={ArrowLeftRight}
                onClick={() => setProjectSelectionDialogOpen(true)}
                aria-label={useI18n('wcag.appbar.project.label')}
                label={activeProjectName}
            />

            <Button
                className="max-sm:hidden"
                size="sm"
                startIcon={stats?.open > 0 ? BellDotIcon : BellIcon}
                onClick={() => {
                    new ShowIssuesDialogEvent().fire();
                }}
                aria-label={useI18n('wcag.appbar.issues.label')}
                label={issuesStatsLabel}
            />

            <IconButton
                size="sm"
                icon={LayoutGrid}
                shape="round"
                onClick={() => {
                    // TODO: Enonic UI Hack - Defer the click to the next event loop to prevent the launcher from closing due to its outside-click handler
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
