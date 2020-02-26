import {ModalDialog, ModalDialogConfig} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Project} from '../data/project/Project';
import {ProjectList} from '../../project/list/ProjectList';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {ProjectListItem} from '../../project/list/ProjectListItem';
import {ProjectContext} from '../../project/ProjectContext';

export class ProjectSelectionDialog
    extends ModalDialog {

    protected config: ProjectSelectionDialogConfig;

    private projectsList: ProjectList;

    private selectedProject: Project;

    constructor(availableProjects: Project[]) {
        super(<ProjectSelectionDialogConfig>{
            availableProjects: availableProjects,
            title: i18n('settings.dialog.project.selection'),
            class: 'project-selection-dialog'
        });
    }

    protected initElements() {
        super.initElements();
        this.projectsList = new ProjectList();
    }

    protected initListeners() {
        super.initListeners();

        this.projectsList.getItemViews().forEach((itemView: ProjectListItem) => {
            itemView.onClicked(() => {
                this.selectedProject = itemView.getProject();
                this.close();
            });
        });
    }

    protected postInitElements() {
        super.postInitElements();

        this.projectsList.setItems(this.config.availableProjects);
    }

    close() {
        super.close();

        const projectToSet: Project = !!this.selectedProject ? this.selectedProject : this.config.availableProjects[0];
        ProjectContext.get().setProject(projectToSet.getName());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            if (this.projectsList.getItemCount() > 0) {
                this.appendChildToContentPanel(this.projectsList);
            } else {
                const notificationEl = new H6El('notification-dialog-text').setHtml(i18n('notify.settings.project.notInitialized'));
                this.appendChildToContentPanel(notificationEl);
            }

            return rendered;
        });
    }

}

interface ProjectSelectionDialogConfig
    extends ModalDialogConfig {
    availableProjects: Project[];
}
