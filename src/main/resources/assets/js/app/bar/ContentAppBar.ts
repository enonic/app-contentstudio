import {AppBar} from 'lib-admin-ui/app/bar/AppBar';
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
import {ProjectListRequest} from '../settings/resource/ProjectListRequest';
import {ProjectListWithMissingRequest} from '../settings/resource/ProjectListWithMissingRequest';

export class ContentAppBar
    extends AppBar {

    private selectedProjectViewer: ProjectViewer;

    private showIssuesDialogButton: ShowIssuesDialogButton;

    constructor(application: Application) {
        super(application);

        this.initElements();
        this.initListeners();

        if (ProjectContext.get().isInitialized()) {
            this.handleProjectUpdate();
        }
    }

    private initElements() {
        this.selectedProjectViewer = new ProjectViewer();
        this.showIssuesDialogButton = new ShowIssuesDialogButton();
    }

    private initListeners() {
        this.selectedProjectViewer.onClicked(() => {
            ProjectSelectionDialog.get().open();
        });

        const handler: () => void = this.handleProjectUpdate.bind(this);

        ProjectContext.get().onProjectChanged(handler);
        ProjectUpdatedEvent.on(handler);
    }

    private handleProjectUpdate() {
        if (!ProjectContext.get().isInitialized()) {
            return;
        }

        const currentProjectName: string = ProjectContext.get().getProject().getName();

        new ProjectListWithMissingRequest().sendAndParse().then((projects: Project[]) => {
            ProjectSelectionDialog.get().setProjects(projects);
            const project: Project = projects.find((p: Project) => p.getName() === currentProjectName);
            this.selectedProjectViewer.setObject(project);
            this.selectedProjectViewer.toggleClass('multi-projects', projects.length > 1);
        }).catch(DefaultErrorHandler.handle);
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.selectedProjectViewer.setTitle(i18n('text.selectContext'));
            this.addClass('appbar-content');
            this.insertChild(this.selectedProjectViewer, 0);
            const buttonWrapper: DivEl = new DivEl('show-issues-button-wrapper');
            buttonWrapper.appendChild(this.showIssuesDialogButton);
            this.appendChild(buttonWrapper);

            return rendered;
        });
    }
}
