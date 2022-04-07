import {Application} from 'lib-admin-ui/app/Application';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ShowIssuesDialogButton} from '../issue/view/ShowIssuesDialogButton';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Project} from '../settings/data/project/Project';
import {ProjectViewer} from '../settings/wizard/viewer/ProjectViewer';
import {ProjectContext} from '../project/ProjectContext';
import {ProjectSelectionDialog} from '../settings/dialog/ProjectSelectionDialog';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ProjectUpdatedEvent} from '../settings/event/ProjectUpdatedEvent';
import {ProjectListWithMissingRequest} from '../settings/resource/ProjectListWithMissingRequest';
import {AccessibilityHelper} from '../util/AccessibilityHelper';
import {TabbedAppBar} from 'lib-admin-ui/app/bar/TabbedAppBar';
import {Store} from 'lib-admin-ui/store/Store';
import {AppBarActions} from 'lib-admin-ui/app/bar/AppBarActions';

export class ContentAppBar
    extends TabbedAppBar {

    private selectedProjectViewer: ProjectViewer;

    private showIssuesDialogButton: ShowIssuesDialogButton;

    private viewerAndNameSeparator: DivEl;

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
        this.setHomeIconAction();
        this.disableHomeButton();

        this.selectedProjectViewer.onClicked(() => {
            ProjectSelectionDialog.get().open();
        });

        const handler: () => void = this.handleProjectUpdate.bind(this);

        ProjectContext.get().onProjectChanged(handler);
        ProjectUpdatedEvent.on(handler);
    }

    private handleProjectUpdate() {
        const currentProjectName: string = ProjectContext.get().getProject().getName();

        new ProjectListWithMissingRequest().sendAndParse().then((projects: Project[]) => {
            ProjectSelectionDialog.get().setProjects(projects);
            const project: Project = projects.find((p: Project) => p.getName() === currentProjectName);
            this.selectedProjectViewer.setObject(project);
            this.selectedProjectViewer.toggleClass('multi-projects', projects.length > 1);
        }).catch(DefaultErrorHandler.handle);
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

    disableHomeButton(): void {
        this.getAppIcon().removeClass('clickable');
        AppBarActions.SHOW_BROWSE_PANEL.setEnabled(false);
    }

    enableHomeButton(): void {
        this.getAppIcon().addClass('clickable');
        AppBarActions.SHOW_BROWSE_PANEL.setEnabled(true);
    }

    setAppName(name: string) {
        this.getAppIcon().show();

        super.setAppName(name);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const iconEl: DivEl = new DivEl('project-selection-icon icon-compare');
            AccessibilityHelper.tabIndex(iconEl);
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
