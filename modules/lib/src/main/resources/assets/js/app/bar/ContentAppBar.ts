import {type Application} from '@enonic/lib-admin-ui/app/Application';
import {TabbedAppBar} from '@enonic/lib-admin-ui/app/bar/TabbedAppBar';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import type Q from 'q';
import {ShowIssuesDialogButton} from '../issue/view/ShowIssuesDialogButton';
import {Project} from '../settings/data/project/Project';
import {ProjectViewer} from '../settings/wizard/viewer/ProjectViewer';
import {AccessibilityHelper} from '../util/AccessibilityHelper';
import {$activeProject, $noProjectMode, $projects} from '../../v6/features/store/projects.store';

export class ContentAppBar
    extends TabbedAppBar {

    private selectedProjectViewer: ProjectViewer;

    private showIssuesDialogButton: ShowIssuesDialogButton;

    private viewerAndNameSeparator: DivEl;

    private readonly cleanups: (() => void)[] = [];

    private constructor(application: Application) {
        super(application);

        this.initElements();
        this.initListeners();
        this.handleProjectUpdate();
    }

    private initElements() {
        this.selectedProjectViewer = new ProjectViewer();
        this.viewerAndNameSeparator = new DivEl('separator').setHtml('/');
        this.showIssuesDialogButton = new ShowIssuesDialogButton();

        this.showIssuesDialogButton.hide();
        this.hideProjectSelector();
        this.getAppIcon().hide();
    }

    private initListeners() {
        AccessibilityHelper.makeTabbable(this.selectedProjectViewer);

        const handler = this.handleProjectUpdate.bind(this);

        this.cleanups.push($projects.subscribe(handler));

        this.onRemoved(() => {
            this.cleanups.forEach((cleanup) => cleanup());
            this.cleanups.length = 0;
        });
    }

    private handleProjectUpdate(): void {
        const activeProject = $activeProject.get();

        if ($noProjectMode.get() || !activeProject) {
            this.disable();
            return;
        }

        this.enable();
        this.selectedProjectViewer.setObject(activeProject as Project);
        this.selectedProjectViewer.toggleClass('multi-projects', $projects.get().projects.length > 1);
    }

    static getInstance(): ContentAppBar {
        let instance: ContentAppBar = Store.instance().get(ContentAppBar.name);

        if (instance == null) {
            instance = new ContentAppBar(Store.instance().get('application'));
            Store.instance().set(ContentAppBar.name, instance);
        }

        return instance;
    }

    disable() {
        this.showIssuesDialogButton.hide();
        this.selectedProjectViewer.setObject(Project.create().setDisplayName(`<${i18n('settings.projects.notfound')}>`).build());
        this.selectedProjectViewer.addClass('no-project');
    }

    enable() {
        this.showIssuesDialogButton.show();
        this.selectedProjectViewer.removeClass('no-project');
    }

    hideIssuesButton(): void {
        this.showIssuesDialogButton.hide();
    }

    showIssuesButton(): void {
        this.showIssuesDialogButton.show();
    }

    hideTabs(): void {
        this.addClass('hide-tab-menu');
    }

    showTabs(): void {
        this.removeClass('hide-tab-menu');
    }

    hideProjectSelector(): void {
        this.addClass('project-selector-hidden');
    }

    showProjectSelector(): void {
        this.removeClass('project-selector-hidden');
    }

    setAppName(name: string) {
        this.getAppIcon().show();

        super.setAppName(name);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const iconEl: DivEl = new DivEl('project-selection-icon icon-dropdown');
            this.selectedProjectViewer.appendChild(iconEl);
            this.selectedProjectViewer.setTitle(i18n('text.selectContext'));
            this.addClass('appbar-content');
            this.insertChild(this.selectedProjectViewer, 0);
            this.insertChild(this.viewerAndNameSeparator, 1);
            const buttonWrapper: DivEl = new DivEl('show-issues-button-wrapper');
            buttonWrapper.appendChild(this.showIssuesDialogButton);
            this.appendChild(buttonWrapper);

            return rendered;
        });
    }
}
