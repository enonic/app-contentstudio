import {Store} from '@enonic/lib-admin-ui/store/Store';
import {Button} from '@enonic/ui';
import {atom} from 'nanostores';
import {useStore} from '@nanostores/preact';
import {ArrowLeftRight, BellDotIcon, BellIcon} from 'lucide-react';
import {ReactElement} from 'react';
import {ShowIssuesDialogEvent} from '../../../../../app/browse/ShowIssuesDialogEvent';
import {useI18n} from '../../../hooks/useI18n';
import {$activeProjectName, $noProjectMode} from '../../../store/projects.store';
import {setProjectSelectionDialogOpen} from '../../../store/dialogs.store';
import {$issuesStats} from '../../../store/issuesStats.store';
import {IssueStatsJson} from '../../../../../app/issue/json/IssueStatsJson';
import {LegacyElement} from '../../../shared/LegacyElement';
import {ThemeSwitcher} from '../../../shared/ThemeSwitcher';

const $isProjectSelectorVisible = atom<boolean>(true);
const $appName = atom<string>('');

function createIssuesLabelKeys(stats: Readonly<IssueStatsJson> | undefined): [`field.${string}`, ...string[]] {
    if (stats?.openAssignedToMe > 0) {
        return ['field.assignedToMeCount', String(stats.openAssignedToMe)];
    }

    if (stats?.open > 0) {
        return ['field.openIssuesCount', String(stats.open)];
    }

    return ['field.noOpenIssues'];
}

export const BrowseAppBar = (): ReactElement => {
    const activeProjectName = useStore($activeProjectName);
    const noProjectMode = useStore($noProjectMode);
    const isProjectSelectorVisible = useStore($isProjectSelectorVisible);
    const appName = useStore($appName);
    const {stats} = useStore($issuesStats);
    const applicationName = Store.instance().get('application').getName();
    const issuesStatsLabel = useI18n(...createIssuesLabelKeys(stats));
    const projectAriaLabel = useI18n('wcag.appbar.project.label');
    const issuesAriaLabel = useI18n('wcag.appbar.issues.label');

    return (
        <header className="bg-surface-neutral h-15 px-5 py-2 pr-24 flex items-center gap-2.5 border-b border-bdr-soft">
            {!noProjectMode && isProjectSelectorVisible ? (
                <Button
                    className="mr-auto"
                    size="sm"
                    endIcon={ArrowLeftRight}
                    onClick={() => setProjectSelectionDialogOpen(true)}
                    aria-label={projectAriaLabel}
                    label={activeProjectName}
                />
            ) : (
                <h1 className="mr-auto text-2xl font-semibold">{appName || applicationName}</h1>
            )}

            {!noProjectMode && (
                <>
                    <Button
                        className="max-sm:hidden"
                        size="sm"
                        startIcon={stats?.open > 0 ? BellDotIcon : BellIcon}
                        onClick={() => {
                            new ShowIssuesDialogEvent().fire();
                        }}
                        aria-label={issuesAriaLabel}
                        label={issuesStatsLabel}
                    />

                    <ThemeSwitcher />
                </>
            )}
        </header>
    );
};

BrowseAppBar.displayName = 'BrowseAppBar';

export class BrowseAppBarElement extends LegacyElement<typeof BrowseAppBar> {
    constructor() {
        super({}, BrowseAppBar);
    }

    // Backwards compatibility - will be removed after implementing the proper stores for projects & issues

    static getInstance(): BrowseAppBarElement {
        let instance: BrowseAppBarElement = Store.instance().get(BrowseAppBarElement.name);

        if (instance == null) {
            instance = new BrowseAppBarElement();
            Store.instance().set(BrowseAppBarElement.name, instance);
        }

        return instance;
    }

    setAppName(name: string) {
        $appName.set(name);
    }

    disable() { }

    showIssuesButton() { }

    hideIssuesButton() { }

    showProjectSelector() {
        $isProjectSelectorVisible.set(true);
    }

    hideProjectSelector() {
        $isProjectSelectorVisible.set(false);
    }
}
